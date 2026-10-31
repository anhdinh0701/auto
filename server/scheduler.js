const fs = require('fs');
const path = require('path');
const db = require('./db');
const connectorRegistry = require('./connectors/ConnectorRegistry');
const { validateListingLocation, checkChannelLocationMatch } = require('./locationValidator');

const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Server-Side Publishing Scheduler & Worker Execution Engine
 * 
 * Supports:
 * - Worker lifecycle state machine (PENDING, SCHEDULED, RUNNING, CONNECTING, PUBLISHING, PUBLISHED, FAILED, NEEDS_MANUAL_ACTION)
 * - Geographic & Contradiction pre-publishing gatekeeper
 * - Execution log tracking (publishing_execution_logs)
 * - Approved photo bundle verification
 * - Asia/Ho_Chi_Minh scheduling compliance
 */
class PublishingScheduler {
  constructor() {
    this.timer = null;
    this.intervalMs = 5000; // Poll every 5s
    this.isProcessing = false;
  }

  start() {
    if (this.timer) return;
    console.log('[Scheduler] Publishing Queue & Worker Engine started (Interval: 5s)');
    this.timer = setInterval(() => this.processQueue(), this.intervalMs);
    setTimeout(() => this.processQueue(), 1500);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Publishing Queue Engine stopped');
    }
  }

  logExecution(jobId, action, status, details = '', errorCode = null, durationMs = 0, retryCount = 0) {
    try {
      const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      db.prepare(`
        INSERT INTO publishing_execution_logs (
          id, job_id, worker_name, action, status, error_code, retry_count, duration_ms, details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        logId,
        jobId,
        'Worker-Node-01',
        action,
        status,
        errorCode,
        retryCount,
        durationMs,
        details,
        new Date().toISOString()
      );
    } catch (e) {
      console.error('[Scheduler] Failed to write execution log:', e.message);
    }
  }

  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date().toISOString();

      // Find tasks ready to execute:
      // Status in 'queued' or 'scheduled' with scheduled_at <= now
      const pendingTasks = db.prepare(`
        SELECT t.*, c.channel_type, c.publishing_capability, c.url as channel_url, c.name as channel_name,
               c.province as channel_province, c.district as channel_district
        FROM publishing_tasks t
        JOIN channels c ON t.channel_id = c.id
        WHERE (t.status = 'queued' OR (t.status = 'scheduled' AND datetime(t.scheduled_at) <= datetime(?)))
          AND t.attempt_count < t.max_attempts
        ORDER BY datetime(t.created_at) ASC
        LIMIT 5
      `).all(now);

      for (const task of pendingTasks) {
        await this.executeTask(task);
      }
    } catch (err) {
      console.error('[Scheduler] Queue processing error:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async executeTask(task) {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    const newAttemptCount = (task.attempt_count || 0) + 1;

    // Transition state: RUNNING
    db.prepare(`
      UPDATE publishing_tasks
      SET status = 'publishing', worker_state = 'RUNNING', started_at = ?, attempt_count = ?, updated_at = ?
      WHERE id = ?
    `).run(startedAt, newAttemptCount, startedAt, task.id);

    this.logExecution(task.id, 'WORKER_ACQUIRED', 'RUNNING', 'Worker nhận tác vụ từ hàng đợi.', null, 0, newAttemptCount);

    // STEP 1: Fetch listing and verify location sanity
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(task.listing_id);
    const channel = {
      id: task.channel_id,
      name: task.channel_name,
      url: task.channel_url,
      channel_type: task.channel_type,
      publishing_capability: task.publishing_capability,
      province: task.channel_province,
      district: task.channel_district
    };

    if (listing) {
      const locValidation = validateListingLocation(listing);
      const channelLocCheck = checkChannelLocationMatch(listing, channel);

      // If fatal contradiction exists (e.g. project in Hanoi vs address in HCM)
      if (locValidation.status === 'NEEDS_REVIEW' || locValidation.status === 'INVALID') {
        const errorMsg = `Chặn đăng tự động do dữ liệu địa lý bất hợp lệ: ${locValidation.reasons.join(' | ')}`;
        const duration = Date.now() - startTime;

        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'failed',
            worker_state = 'FAILED',
            location_verification_status = ?,
            error_code = 'LOCATION_CONTRADICTION_BLOCK',
            error_message = ?,
            completed_at = ?,
            updated_at = ?
          WHERE id = ?
        `).run(locValidation.status, errorMsg, new Date().toISOString(), new Date().toISOString(), task.id);

        this.logExecution(task.id, 'LOCATION_GATE_CHECK', 'FAILED', errorMsg, 'LOCATION_CONTRADICTION_BLOCK', duration, newAttemptCount);
        return;
      }

      // If channel geographic restriction is completely violated
      if (!channelLocCheck.matched && channelLocCheck.severity === 'block') {
        const duration = Date.now() - startTime;
        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'failed',
            worker_state = 'FAILED',
            error_code = 'GEOGRAPHIC_MISMATCH_BLOCK',
            error_message = ?,
            completed_at = ?,
            updated_at = ?
          WHERE id = ?
        `).run(channelLocCheck.reason, new Date().toISOString(), new Date().toISOString(), task.id);

        this.logExecution(task.id, 'GEOGRAPHIC_CHECK', 'FAILED', channelLocCheck.reason, 'GEOGRAPHIC_MISMATCH_BLOCK', duration, newAttemptCount);
        return;
      }

      // Update task location verification status
      db.prepare('UPDATE publishing_tasks SET location_verification_status = ? WHERE id = ?')
        .run(locValidation.status, task.id);

      this.logExecution(task.id, 'LOCATION_GATE_CHECK', 'SUCCESS', `Kiểm tra địa lý hoàn tất. Trạng thái: ${locValidation.status}`, null, 10, newAttemptCount);
    }

    // STEP 1.5: Validate all approved images on disk before publication
    let mediaList = [];
    try {
      mediaList = typeof task.media_urls === 'string' ? JSON.parse(task.media_urls || '[]') : (task.media_urls || []);
    } catch (_) {}

    for (const mediaItem of mediaList) {
      const mediaUrl = typeof mediaItem === 'string' ? mediaItem : mediaItem?.url;
      if (mediaUrl && mediaUrl.startsWith('/uploads/')) {
        const filename = path.basename(mediaUrl);
        const diskPath = path.join(uploadsDir, filename);
        if (!fs.existsSync(diskPath)) {
          const errorMsg = `Tệp hình ảnh không tồn tại trên máy chủ: ${filename}`;
          const duration = Date.now() - startTime;
          db.prepare(`
            UPDATE publishing_tasks SET
              status = 'failed',
              worker_state = 'FAILED',
              outcome_type = 'failed',
              error_category = 'VALIDATION',
              retry_eligible = 0,
              error_code = 'IMAGE_VALIDATION_FAILED',
              error_message = ?,
              completed_at = ?,
              updated_at = ?
            WHERE id = ?
          `).run(errorMsg, new Date().toISOString(), new Date().toISOString(), task.id);

          this.logExecution(task.id, 'IMAGE_VALIDATION', 'FAILED', errorMsg, 'IMAGE_VALIDATION_FAILED', duration, newAttemptCount);
          return;
        }
      }
    }

    // STEP 2: Transition state to CONNECTING
    db.prepare("UPDATE publishing_tasks SET worker_state = 'CONNECTING' WHERE id = ?").run(task.id);
    this.logExecution(task.id, 'CONNECTOR_CONNECT', 'CONNECTING', `Đang thiết lập phiên kết nối với kênh "${channel.name}" (${channel.channel_type}).`, null, 20, newAttemptCount);

    try {
      const connector = connectorRegistry.getConnectorForChannel(channel);

      // STEP 3: Transition state to PUBLISHING
      db.prepare("UPDATE publishing_tasks SET worker_state = 'PUBLISHING' WHERE id = ?").run(task.id);
      this.logExecution(task.id, 'DISPATCHING_PAYLOAD', 'PUBLISHING', 'Đang chuyển giao gói nội dung và ảnh sang giao tiếp nền tảng.', null, 30, newAttemptCount);

      const result = await connector.publish(task, channel);
      const completedAt = new Date().toISOString();
      const duration = Date.now() - startTime;
      const rawResponseStr = JSON.stringify(result.rawResponse || result || {});

      if (result.status === 'published') {
        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'published',
            worker_state = 'PUBLISHED',
            outcome_type = @outcomeType,
            platform_post_id = @platformPostId,
            published_url = @publishedUrl,
            raw_connector_response = @rawResponse,
            error_code = NULL,
            error_message = NULL,
            error_category = NULL,
            retry_eligible = 0,
            completed_at = @completedAt,
            updated_at = @completedAt
          WHERE id = @id
        `).run({
          id: task.id,
          outcomeType: result.outcomeType || 'platform_confirmed',
          platformPostId: result.platformPostId || null,
          publishedUrl: result.publishedUrl || null,
          rawResponse: rawResponseStr,
          completedAt
        });

        this.logExecution(task.id, 'PUBLISH_COMPLETE', 'PUBLISHED', `Xuất bản thành công. Post ID: ${result.platformPostId || 'N/A'}. URL: ${result.publishedUrl || 'N/A'}`, null, duration, newAttemptCount);
      } else if (result.status === 'needs_manual_action') {
        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'needs_manual_action',
            worker_state = 'NEEDS_MANUAL_ACTION',
            outcome_type = 'unknown',
            raw_connector_response = @rawResponse,
            error_code = NULL,
            error_message = @errorMessage,
            error_category = NULL,
            retry_eligible = 0,
            completed_at = @completedAt,
            updated_at = @completedAt
          WHERE id = @id
        `).run({
          id: task.id,
          errorMessage: result.errorMessage || 'Yêu cầu xuất bản thủ công (Group cá nhân/kín).',
          rawResponse: rawResponseStr,
          completedAt
        });

        this.logExecution(task.id, 'MANUAL_DISPATCH', 'NEEDS_MANUAL_ACTION', result.errorMessage || 'Yêu cầu thao tác đăng thủ công từ điều phối viên.', null, duration, newAttemptCount);
      } else {
        // Failed
        const errCategory = result.errorCode?.includes('AUTH') ? 'AUTH' :
                            result.errorCode?.includes('GEO') ? 'GEOGRAPHIC' :
                            result.errorCode?.includes('VAL') ? 'VALIDATION' :
                            result.errorCode?.includes('NET') ? 'NETWORK' : 'PLATFORM';

        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'failed',
            worker_state = 'FAILED',
            outcome_type = 'failed',
            error_code = @errorCode,
            error_message = @errorMessage,
            error_category = @errorCategory,
            retry_eligible = @retryEligible,
            raw_connector_response = @rawResponse,
            completed_at = @completedAt,
            updated_at = @completedAt
          WHERE id = @id
        `).run({
          id: task.id,
          errorCode: result.errorCode || 'UNKNOWN_ERROR',
          errorMessage: result.errorMessage || 'Không thể xuất bản bài đăng.',
          errorCategory: errCategory,
          retryEligible: result.retryEligible !== undefined ? (result.retryEligible ? 1 : 0) : 1,
          rawResponse: rawResponseStr,
          completedAt
        });

        this.logExecution(task.id, 'PUBLISH_FAILED', 'FAILED', result.errorMessage || 'Lỗi khi giao tiếp với nền tảng.', result.errorCode || 'UNKNOWN_ERROR', duration, newAttemptCount);
      }
    } catch (err) {
      const completedAt = new Date().toISOString();
      const duration = Date.now() - startTime;
      db.prepare(`
        UPDATE publishing_tasks SET
          status = 'failed',
          worker_state = 'FAILED',
          outcome_type = 'failed',
          error_code = 'EXECUTION_EXCEPTION',
          error_message = ?,
          error_category = 'PLATFORM',
          retry_eligible = 1,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(err.message, completedAt, completedAt, task.id);

      this.logExecution(task.id, 'EXECUTION_EXCEPTION', 'FAILED', `Lỗi ngoại lệ: ${err.message}`, 'EXECUTION_EXCEPTION', duration, newAttemptCount);
    }
  }
}

module.exports = new PublishingScheduler();
