const express = require('express');
const router = express.Router();
const db = require('../db');
const {
  calculateChannelHealth,
  generateTimeSlotHeatmap,
  exportLabeledTrainingData
} = require('../channelIntelligence');
const smartScheduler = require('../smartScheduler');
const { v4: uuidv4 } = require('uuid');

// ==================== PHASE 3: GROUP & TIME INTELLIGENCE ==================== //

// 1. GET TargetGroups
router.get('/target-groups', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM TargetGroups ORDER BY is_active DESC, active_score DESC').all().map(g => ({
      ...g,
      trained_time_slots: typeof g.trained_time_slots === 'string' ? JSON.parse(g.trained_time_slots || '[]') : (g.trained_time_slots || [])
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST create TargetGroup
router.post('/target-groups', (req, res) => {
  try {
    const {
      group_name,
      group_url,
      target_city,
      target_district = '',
      target_property_type = 'Tất cả',
      active_score = 8.5,
      approval_latency_minutes = 15,
      trained_time_slots = ['08:30', '11:45', '19:30', '21:00'],
      is_active = 1
    } = req.body;

    if (!group_name || !group_url || !target_city) {
      return res.status(400).json({
        success: false,
        error: 'Tên nhóm (group_name), Đường dẫn (group_url) và Tỉnh/Thành phố (target_city) là bắt buộc.'
      });
    }

    const id = `grp-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const slotsJson = typeof trained_time_slots === 'string' ? trained_time_slots : JSON.stringify(trained_time_slots);

    db.prepare(`
      INSERT INTO TargetGroups (
        id, group_name, group_url, target_city, target_district, target_property_type,
        active_score, approval_latency_minutes, trained_time_slots, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, group_name, group_url, target_city, target_district, target_property_type,
      parseFloat(active_score) || 7.0,
      parseInt(approval_latency_minutes, 10) || 15,
      slotsJson,
      is_active ? 1 : 0,
      now, now
    );

    const created = db.prepare('SELECT * FROM TargetGroups WHERE id = ?').get(id);
    created.trained_time_slots = JSON.parse(created.trained_time_slots || '[]');

    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PUT update TargetGroup
router.put('/target-groups/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM TargetGroups WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhóm mục tiêu cần cập nhật.' });
    }

    const {
      group_name = existing.group_name,
      group_url = existing.group_url,
      target_city = existing.target_city,
      target_district = existing.target_district,
      target_property_type = existing.target_property_type,
      active_score = existing.active_score,
      approval_latency_minutes = existing.approval_latency_minutes,
      trained_time_slots,
      is_active
    } = req.body;

    const slotsJson = trained_time_slots !== undefined
      ? (typeof trained_time_slots === 'string' ? trained_time_slots : JSON.stringify(trained_time_slots))
      : existing.trained_time_slots;
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE TargetGroups SET
        group_name = ?,
        group_url = ?,
        target_city = ?,
        target_district = ?,
        target_property_type = ?,
        active_score = ?,
        approval_latency_minutes = ?,
        trained_time_slots = ?,
        is_active = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      group_name, group_url, target_city, target_district, target_property_type,
      parseFloat(active_score), parseInt(approval_latency_minutes, 10),
      slotsJson, activeVal, new Date().toISOString(), id
    );

    const updated = db.prepare('SELECT * FROM TargetGroups WHERE id = ?').get(id);
    updated.trained_time_slots = JSON.parse(updated.trained_time_slots || '[]');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE TargetGroup
router.delete('/target-groups/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM TargetGroups WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy nhóm để xóa.' });
    }
    res.json({ success: true, message: 'Đã xóa nhóm Facebook thành công.', id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Hard-Check Preview API for a Property
router.get('/hardcheck/:property_id', (req, res) => {
  try {
    const result = smartScheduler.filterValidGroupsForProperty(req.params.property_id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Groq AI Smart Schedule Generator
router.post('/smart-schedule', async (req, res) => {
  try {
    const propertyId = req.body.property_id || req.body.listing_id;
    if (!propertyId) {
      return res.status(400).json({ success: false, error: 'Thiếu property_id hoặc listing_id cần lên lịch.' });
    }

    const plan = await smartScheduler.generateSmartSchedulePlan(propertyId, req.body.options || {});
    res.json({ success: true, data: plan });
  } catch (err) {
    console.error('[SmartSchedule API Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET PostingSchedules enriched with group details
router.get('/posting-schedules', (req, res) => {
  try {
    const schedules = db.prepare(`
      SELECT 
        s.*,
        p.title as property_title,
        p.city as property_city,
        p.district as property_district,
        g.group_name,
        g.group_url,
        g.target_city as group_city,
        g.approval_latency_minutes
      FROM PostingSchedules s
      LEFT JOIN Properties p ON s.property_id = p.id
      LEFT JOIN TargetGroups g ON s.group_id = g.id
      ORDER BY s.scheduled_time ASC
    `).all().map(s => ({
      ...s,
      selected_media_ids: typeof s.selected_media_ids === 'string' ? JSON.parse(s.selected_media_ids || '[]') : (s.selected_media_ids || [])
    }));
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// GET health analysis for a specific channel
router.get('/channels/:id/health', (req, res) => {
  try {
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy kênh đăng tin.' });
    }

    const health = calculateChannelHealth(channel);

    // Update channel record with latest health score & confidence
    db.prepare(`
      UPDATE channels SET
        health_score = ?,
        health_confidence = ?,
        health_breakdown = ?,
        approval_type = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      health.health_score,
      health.confidence,
      JSON.stringify(health.breakdown),
      health.approval_type,
      new Date().toISOString(),
      channel.id
    );

    res.json({
      success: true,
      data: {
        channel_id: channel.id,
        channel_name: channel.name,
        channel_type: channel.channel_type,
        ...health
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET batch health scores for all channels
router.get('/channels-health-overview', (req, res) => {
  try {
    const channels = db.prepare('SELECT * FROM channels').all();
    const overview = channels.map(c => {
      const health = calculateChannelHealth(c);
      return {
        id: c.id,
        name: c.name,
        channel_type: c.channel_type,
        province: c.province,
        district: c.district,
        member_count: c.member_count,
        health_score: health.health_score,
        confidence: health.confidence,
        confidence_reason: health.confidence_reason,
        approval_type: health.approval_type,
        observation_count: health.observation_count
      };
    });

    res.json({ success: true, data: overview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET 7x24 Time-Slot Heatmap
router.get('/time-slot-heatmap', (req, res) => {
  try {
    const matrix = generateTimeSlotHeatmap();
    res.json({
      success: true,
      data: matrix,
      summary: {
        total_cells: matrix.length,
        recommended_slots_count: matrix.filter(c => c.is_recommended_slot).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET labeled machine learning dataset export
router.get('/time-slot-training-data', (req, res) => {
  try {
    const data = exportLabeledTrainingData();
    res.json({
      success: true,
      data,
      total_records: data.length,
      exported_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
