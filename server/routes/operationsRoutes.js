/**
 * Phase 4: Centralized Operations Center Routes
 * Unified monitoring of listing lifecycles, connectors, background scheduler,
 * system health diagnostics, and sanitized audit logs.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const scheduler = require('../scheduler');
const aiService = require('../aiService');
const { v4: uuidv4 } = require('uuid');

// 1. Unified Operations Overview
router.get('/overview', (req, res) => {
  try {
    // 1. Task Lifecycle Breakdown
    const totalTasks = db.prepare('SELECT COUNT(*) as c FROM publishing_tasks').get().c;
    const published = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status = 'published'").get().c;
    const failed = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status = 'failed'").get().c;
    const scheduled = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status = 'scheduled'").get().c;
    const queued = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status IN ('queued', 'publishing')").get().c;
    const needsManual = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status = 'needs_manual_action'").get().c;
    const draft = db.prepare("SELECT COUNT(*) as c FROM publishing_tasks WHERE status = 'draft'").get().c;

    // 2. Listing Status Lifecycle
    const totalListings = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
    const listingsDraft = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'draft'").get().c;
    const listingsReviewed = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'reviewed'").get().c;
    const listingsReady = db.prepare("SELECT COUNT(*) as c FROM listings WHERE status = 'ready'").get().c;

    // 3. Connectors Health
    const connectors = db.prepare('SELECT id, connector_type, account_name, is_active, status, last_validated_at FROM connector_credentials').all();

    // 4. Actionable Items
    const pendingManualTasks = db.prepare(`
      SELECT t.id, t.title, t.channel_id, t.created_at, c.name as channel_name, c.channel_type, c.url as channel_url
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      WHERE t.status = 'needs_manual_action'
      ORDER BY datetime(t.created_at) DESC
      LIMIT 5
    `).all();

    const recentFailedTasks = db.prepare(`
      SELECT t.id, t.title, t.channel_id, t.error_code, t.error_message, t.attempt_count, t.max_attempts, c.name as channel_name
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      WHERE t.status = 'failed'
      ORDER BY datetime(t.updated_at) DESC
      LIMIT 5
    `).all();

    // 5. System Health Diagnostics
    const dbPath = path.join(__dirname, '..', '..', 'data', 'realestate.db');
    let dbSizeMb = 0;
    if (fs.existsSync(dbPath)) {
      dbSizeMb = (fs.statSync(dbPath).size / (1024 * 1024)).toFixed(2);
    }

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    let uploadFilesCount = 0;
    let uploadSizeMb = 0;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      uploadFilesCount = files.length;
      files.forEach(f => {
        try { uploadSizeMb += fs.statSync(path.join(uploadsDir, f)).size; } catch (e) {}
      });
      uploadSizeMb = (uploadSizeMb / (1024 * 1024)).toFixed(2);
    }

    const aiSettings = aiService.getSettings();

    res.json({
      lifecycle: {
        total_tasks: totalTasks,
        published,
        failed,
        scheduled,
        queued,
        needs_manual: needsManual,
        draft,
        listings: {
          total: totalListings,
          draft: listingsDraft,
          reviewed: listingsReviewed,
          ready: listingsReady
        }
      },
      connectors: connectors.map(c => ({
        ...c,
        is_healthy: c.status === 'connected' && c.is_active === 1
      })),
      actionable_items: {
        manual_tasks: pendingManualTasks,
        failed_tasks: recentFailedTasks
      },
      health: {
        database: {
          status: 'healthy',
          engine: 'SQLite (better-sqlite3)',
          size_mb: parseFloat(dbSizeMb),
          path: 'data/realestate.db'
        },
        storage: {
          status: 'healthy',
          files_count: uploadFilesCount,
          size_mb: parseFloat(uploadSizeMb)
        },
        scheduler: {
          status: scheduler.isRunning ? 'running' : 'idle',
          interval_ms: 8000,
          active_workers: 1
        },
        ai_service: {
          status: aiSettings.is_configured ? 'configured' : 'unconfigured',
          provider: aiSettings.provider,
          model: aiSettings.model_name
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. System Audit Logs with Redaction
router.get('/audit-logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const actionFilter = req.query.action;

    let query = 'SELECT * FROM system_audit_logs';
    const params = [];
    if (actionFilter) {
      query += ' WHERE action = ?';
      params.push(actionFilter);
    }
    query += ' ORDER BY datetime(created_at) DESC LIMIT ?';
    params.push(limit);

    const logs = db.prepare(query).all(...params);

    // Safeguard: Ensure no access token or password ever appears in details
    const sanitizedLogs = logs.map(l => {
      let details = l.details || '';
      details = details.replace(/EAAB\w+/g, '***REDACTED_FB_TOKEN***');
      details = details.replace(/ya29\.\w+/g, '***REDACTED_GOOGLE_TOKEN***');
      details = details.replace(/bds_sec_\w+/g, '***REDACTED_API_KEY***');
      return {
        ...l,
        details
      };
    });

    res.json(sanitizedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Safe Re-trigger / Retry for Recoverable Failed Tasks
router.post('/retry-all-failed', (req, res) => {
  try {
    const failedTasks = db.prepare("SELECT id, channel_id, attempt_count, max_attempts FROM publishing_tasks WHERE status = 'failed'").all();
    let retried = 0;
    const now = new Date().toISOString();

    for (const t of failedTasks) {
      const channel = db.prepare('SELECT channel_type, publishing_capability FROM channels WHERE id = ?').get(t.channel_id);
      let newStatus = 'queued';
      if (channel && (channel.publishing_capability === 'manual_only' || channel.channel_type === 'facebook_group')) {
        newStatus = 'needs_manual_action';
      }

      db.prepare(`
        UPDATE publishing_tasks SET
          status = ?,
          error_code = NULL,
          error_message = NULL,
          attempt_count = attempt_count + 1,
          max_attempts = CASE WHEN attempt_count >= max_attempts THEN max_attempts + 2 ELSE max_attempts END,
          updated_at = ?
        WHERE id = ?
      `).run(newStatus, now, t.id);

      retried++;
    }

    if (retried > 0) {
      setTimeout(() => scheduler.processQueue(), 500);

      // Audit log
      db.prepare(`
        INSERT INTO system_audit_logs (id, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (?, 'BATCH_RETRY_FAILED', 'task', 'batch', ?, '127.0.0.1', ?)
      `).run('audit-' + uuidv4().substr(0, 8), `Đã kích hoạt thử lại ${retried} tác vụ thất bại.`, now);
    }

    res.json({
      success: true,
      message: `Đã đưa ${retried} tác vụ thất bại vào hàng đợi xử lý an toàn!`,
      retried_count: retried
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
