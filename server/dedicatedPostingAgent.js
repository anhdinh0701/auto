const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const db = require('./db');
const chromeStationService = require('./chromeStationService');
const chromePublishService = require('./chromePublishService');
const { getAbsoluteMediaPath } = require('./mediaHelper');

class DedicatedPostingAgent {
  constructor() {
    this.isProcessing = false;
    this.timer = null;
    this.intervalMs = 10000; // Scan every 10 seconds
    this.errorLogsDir = path.resolve(__dirname, '../logs/errors');

    // Ensure error logs directory exists
    if (!fs.existsSync(this.errorLogsDir)) {
      fs.mkdirSync(this.errorLogsDir, { recursive: true });
    }
  }

  /**
   * Start the 60-second background posting loop
   */
  start() {
    if (this.timer) return;
    console.log('[DedicatedPostingAgent] Background Agent started (Interval: 60s)');
    this.timer = setInterval(() => this.scanAndExecuteDueSchedules(), this.intervalMs);
    // Initial check after 3s
    setTimeout(() => this.scanAndExecuteDueSchedules(), 3000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[DedicatedPostingAgent] Background Agent stopped');
    }
  }

  /**
   * Log execution status to database
   */
  logAction(scheduleId, stepName, status, details = '', errorMsg = null) {
    try {
      const logId = `log-agent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO publishing_execution_logs (
          id, job_id, worker_name, action, status, error_code, retry_count, duration_ms, details, created_at
        ) VALUES (?, ?, 'Dedicated-Chrome-Agent-247', ?, ?, ?, 0, 0, ?, ?)
      `).run(
        logId,
        scheduleId,
        stepName,
        status,
        errorMsg ? 'AGENT_ERROR' : null,
        details || '',
        new Date().toISOString()
      );
    } catch (_) {}
  }

  /**
   * Scan PostingSchedules for Pending items whose scheduled_time <= NOW
   */
  async scanAndExecuteDueSchedules() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const nowIso = new Date().toISOString();
      const dueSchedules = db.prepare(`
        SELECT s.*, g.group_name, g.group_url, p.title as property_title
        FROM PostingSchedules s
        LEFT JOIN TargetGroups g ON s.group_id = g.id
        LEFT JOIN Properties p ON s.property_id = p.id
        WHERE s.status = 'Pending' AND datetime(s.scheduled_time) <= datetime(?)
        ORDER BY datetime(s.scheduled_time) ASC
        LIMIT 3
      `).all(nowIso);

      if (dueSchedules.length > 0) {
        console.log(`[DedicatedPostingAgent] Found ${dueSchedules.length} due schedule(s) to post.`);
        for (const schedule of dueSchedules) {
          await this.executePostProcess(schedule);
        }
      }
    } catch (err) {
      console.error('[DedicatedPostingAgent] Scan error:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Resolve absolute image file paths on disk from selected_media_ids or direct image_paths
   */
  resolveImagePaths(schedule) {
    if (Array.isArray(schedule.image_paths) && schedule.image_paths.length > 0) {
      return schedule.image_paths
        .map(p => getAbsoluteMediaPath(p))
        .filter(p => p && fs.existsSync(p));
    }

    let mediaIds = [];
    try {
      mediaIds = typeof schedule.selected_media_ids === 'string'
        ? JSON.parse(schedule.selected_media_ids || '[]')
        : (schedule.selected_media_ids || []);
    } catch (_) {}

    const absolutePaths = [];

    for (const item of mediaIds) {
      let resolved = null;

      // 1. Check in MediaAssets table
      const asset = db.prepare('SELECT * FROM MediaAssets WHERE id = ?').get(item);
      if (asset && asset.file_path) {
        resolved = getAbsoluteMediaPath(asset.file_path);
      }

      // 2. Check in photos table
      if (!resolved) {
        const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(item);
        if (photo) {
          resolved = getAbsoluteMediaPath(photo.url || photo.filename || photo.file_path);
        }
      }

      // 3. Fallback direct file path
      if (!resolved) {
        resolved = getAbsoluteMediaPath(item);
      }

      if (resolved && fs.existsSync(resolved) && !absolutePaths.includes(resolved)) {
        absolutePaths.push(resolved);
      }
    }

    // If no specific media found, check if property has photos
    if (absolutePaths.length === 0 && schedule.property_id) {
      const fallbackAssets = db.prepare(`
        SELECT file_path FROM MediaAssets 
        WHERE property_id = ? 
        ORDER BY sort_order ASC LIMIT 4
      `).all(schedule.property_id);

      for (const a of fallbackAssets) {
        const p = getAbsoluteMediaPath(a.file_path);
        if (p && fs.existsSync(p) && !absolutePaths.includes(p)) {
          absolutePaths.push(p);
        }
      }
    }

    return absolutePaths;
  }

  /**
   * DEDICATED POSTING AGENT
   * Tự động điều khiển Chrome đăng tin theo lịch thông qua chromePublishService
   */
  async executePostProcess(schedule) {
    const scheduleId = schedule.id;
    const groupUrl = schedule.group_url || schedule.group_id;
    const postContent = schedule.spun_content || schedule.opening_hook || 'Bất động sản chính chủ giá tốt';
    const imagePaths = this.resolveImagePaths(schedule);

    console.log(`\n======================================================`);
    console.log(`[DedicatedPostingAgent] >>> BẮT ĐẦU ĐĂNG BÀI THEO LỊCH: ${scheduleId} <<<`);
    console.log(`[DedicatedPostingAgent] Target Group: "${schedule.group_name || groupUrl}" (${groupUrl})`);
    console.log(`[DedicatedPostingAgent] Số ảnh đính kèm: ${imagePaths.length}`);
    console.log(`======================================================`);

    // Update status to In_Progress
    db.prepare(`
      UPDATE PostingSchedules SET 
        status = 'In_Progress', 
        updated_at = ? 
      WHERE id = ?
    `).run(new Date().toISOString(), scheduleId);

    this.logAction(scheduleId, 'AGENT_START', 'RUNNING', `Bắt đầu quy trình đăng tin theo lịch cho nhóm ${schedule.group_name || groupUrl}`);

    try {
      const crossPostKeyword = schedule.cross_post_keyword || 
        (/khai sơn/i.test(schedule.group_name || '') || /khai/i.test(postContent) ? 'khai' : null);

      const publishResult = await chromePublishService.publishToGroup({
        groupUrl,
        content: postContent,
        images: imagePaths,
        crossPostKeyword,
        maxGroups: 10
      });

      const nowComplete = new Date().toISOString();

      // Cập nhật PostingSchedules
      db.prepare(`
        UPDATE PostingSchedules SET
          status = 'Published',
          published_url = ?,
          error_log = NULL,
          updated_at = ?
        WHERE id = ?
      `).run(publishResult.groupUrl || groupUrl, nowComplete, scheduleId);

      // Cập nhật publishing_tasks nếu có
      try {
        db.prepare(`
          UPDATE publishing_tasks SET
            status = 'published',
            worker_state = 'PUBLISHED',
            completed_at = ?,
            updated_at = ?
          WHERE listing_id = ? AND channel_id = ?
        `).run(nowComplete, nowComplete, schedule.property_id, schedule.group_id);
      } catch (_) {}

      this.logAction(scheduleId, 'POST_SUCCESS', 'COMPLETED', `Đăng bài theo lịch thành công vào nhóm ${schedule.group_name || groupUrl}!`);
      console.log(`[DedicatedPostingAgent] >>> THÀNH CÔNG: Đã xuất bản lịch đăng ${scheduleId} <<<`);

      return {
        success: true,
        scheduleId,
        groupUrl,
        status: 'Published',
        publishedAt: nowComplete,
        message: `Đăng tin thành công vào nhóm "${schedule.group_name || groupUrl}"!`
      };

    } catch (error) {
      console.error(`[DedicatedPostingAgent] ERROR during schedule ${scheduleId}:`, error.message);

      const errorMsg = error.message || 'Lỗi không xác định khi đăng bài qua Chrome';
      const errorDetail = error.screenshotUrl
        ? `${errorMsg} (Ảnh chụp màn hình: ${path.basename(error.screenshotUrl)})`
        : errorMsg;

      db.prepare(`
        UPDATE PostingSchedules SET
          status = 'Failed',
          error_log = ?,
          updated_at = ?
        WHERE id = ?
      `).run(errorDetail, new Date().toISOString(), scheduleId);

      this.logAction(scheduleId, 'AGENT_ERROR', 'FAILED', errorDetail, errorMsg);

      return {
        success: false,
        scheduleId,
        status: 'Failed',
        error: errorDetail
      };
    }
  }

  /**
   * Direct human-like post execution from Single-Page Workspace
   */
  async executeDirectPost({ group_url, content, image_filenames = [], scheduled_time = null }) {
    if (!group_url || !group_url.trim()) {
      throw new Error('Vui lòng nhập đường dẫn URL Nhóm Facebook cần đăng.');
    }
    if (!content || !content.trim()) {
      throw new Error('Vui lòng nhập nội dung bài viết cần đăng.');
    }

    const cleanGroupUrl = group_url.trim();
    const cleanContent = content.trim();
    const scheduleId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    // If scheduled for a future time
    if (scheduled_time && new Date(scheduled_time) > new Date()) {
      const scheduledIso = new Date(scheduled_time).toISOString();
      db.prepare(`
        INSERT INTO PostingSchedules (
          id, property_id, group_id, selected_media_ids, scheduled_time,
          target_time_slot, opening_hook, spun_content, status, created_at, updated_at
        ) VALUES (?, 'direct-post', ?, ?, ?, ?, '', ?, 'Pending', ?, ?)
      `).run(
        scheduleId,
        cleanGroupUrl,
        JSON.stringify(image_filenames),
        scheduledIso,
        scheduledIso.slice(11, 16),
        cleanContent,
        nowIso,
        nowIso
      );

      return {
        success: true,
        isScheduled: true,
        scheduleId,
        scheduled_time: scheduledIso,
        message: `Đã lên lịch đăng bài thành công vào lúc: ${new Date(scheduled_time).toLocaleString('vi-VN')}`
      };
    }

    // Immediate post
    const scheduleObj = {
      id: scheduleId,
      property_id: 'direct-post',
      group_name: cleanGroupUrl.split('/groups/')[1]?.split('/')[0] || 'Facebook Group',
      group_url: cleanGroupUrl,
      spun_content: cleanContent,
      opening_hook: '',
      image_paths: image_filenames,
      selected_media_ids: JSON.stringify(image_filenames)
    };

    // Also persist record in PostingSchedules for tracking
    db.prepare(`
      INSERT INTO PostingSchedules (
        id, property_id, group_id, selected_media_ids, scheduled_time,
        target_time_slot, opening_hook, spun_content, status, created_at, updated_at
      ) VALUES (?, 'direct-post', ?, ?, ?, 'Now', '', ?, 'In_Progress', ?, ?)
    `).run(
      scheduleId,
      cleanGroupUrl,
      JSON.stringify(image_filenames),
      nowIso,
      cleanContent,
      nowIso,
      nowIso
    );

    return await this.executePostProcess(scheduleObj);
  }

  /**
   * Immediate manual trigger ("Đăng thử ngay lập tức") for a specific schedule
   */
  async postNow(scheduleId) {
    const schedule = db.prepare(`
      SELECT s.*, g.group_name, g.group_url, p.title as property_title
      FROM PostingSchedules s
      LEFT JOIN TargetGroups g ON s.group_id = g.id
      LEFT JOIN Properties p ON s.property_id = p.id
      WHERE s.id = ?
    `).get(scheduleId);

    if (!schedule) {
      throw new Error(`Không tìm thấy lịch đăng với mã: ${scheduleId}`);
    }

    return await this.executePostProcess(schedule);
  }
}

module.exports = new DedicatedPostingAgent();
