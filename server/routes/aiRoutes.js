/**
 * Phase 4: AI Optimization Routes
 * Connects AI Service to the frontend workspace with strict fact checking,
 * multi-version generation, and user approval workflows.
 */

const express = require('express');
const router = express.Router();
const aiService = require('../aiService');
const db = require('../db');

// 1. Settings & Credential Management
router.get('/settings', (req, res) => {
  try {
    const settings = aiService.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', (req, res) => {
  try {
    const updated = aiService.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const result = await aiService.testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Generate Multi-version Headlines
router.post('/headlines', async (req, res) => {
  try {
    const { listing_id, listing_data } = req.body;
    let listing = listing_data;
    if (!listing && listing_id) {
      listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
    }
    if (!listing) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu tin bất động sản.' });
    }

    const headlines = await aiService.generateHeadlines(listing);
    res.json({
      success: true,
      listing_id: listing.id,
      headlines
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Rewrite Description by Channel & Audience
router.post('/rewrite', async (req, res) => {
  try {
    const { listing_id, listing_data, channel_type = 'facebook_page', target_audience = 'all' } = req.body;
    let listing = listing_data;
    if (!listing && listing_id) {
      listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
    }
    if (!listing) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu tin bất động sản.' });
    }

    const result = await aiService.rewriteDescription(listing, channel_type, target_audience);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Quality & Spell Check
router.post('/quality-check', (req, res) => {
  try {
    const { title = '', description = '', listing_data = {} } = req.body;
    const report = aiService.checkContentQuality(title, description, listing_data);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Cross-Listing Duplicate Content Detection
router.post('/duplicate-check', (req, res) => {
  try {
    const { title = '', description = '', listing_id = null } = req.body;
    const result = aiService.checkDuplicateContent(title, description, listing_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Data Consistency Fact Verification
router.post('/consistency-check', (req, res) => {
  try {
    const { listing_id, listing_data, title = '', description = '' } = req.body;
    let listing = listing_data;
    if (!listing && listing_id) {
      listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
    }
    if (!listing) {
      return res.status(400).json({ error: 'Cần thông số tin đăng để kiểm tra tính nhất quán.' });
    }

    const result = aiService.checkConsistency(listing, title, description);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Best Time to Post Recommendation
router.get('/best-time', (req, res) => {
  try {
    const { channel_type = 'facebook_page' } = req.query;
    const result = aiService.suggestPostingTime(channel_type);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7b. MODULE 1: NLP Feature Extractor (llama-3.3-70b-versatile with JSON mode)
router.post('/extract-features', async (req, res) => {
  try {
    const { raw_content, content, listing_id, property_id } = req.body;
    const textToAnalyze = raw_content || content;
    const targetId = listing_id || property_id;

    if (!textToAnalyze || !textToAnalyze.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp nội dung bài viết.' });
    }

    const result = await aiService.extractFeaturesNLP(textToAnalyze, targetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. MODULE 2: AI Photo Scoring & Smart Selection (Groq Vision Matching)
router.post('/select-photos', async (req, res) => {
  try {
    const { listing_id, property_id, photos: inputPhotos, channel_type = 'facebook_feed', target_limit = 4, key_selling_points, required_image_types } = req.body;
    const targetId = listing_id || property_id;

    const visionResult = await aiService.analyzeAndScorePhotosWithVision(targetId, inputPhotos, {
      channel_type,
      target_limit,
      key_selling_points,
      required_image_types
    });

    res.json(visionResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Persist User-Approved Photo Bundle
router.post('/approve-photo-bundle', (req, res) => {
  try {
    const { listing_id, approved_photo_ids, notes } = req.body;
    if (!listing_id) {
      return res.status(400).json({ success: false, error: 'Thiếu listing_id.' });
    }

    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tin đăng.' });
    }

    const approvedList = Array.isArray(approved_photo_ids) ? approved_photo_ids : [];
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE listings SET
        approved_photo_ids = ?,
        updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(approvedList), now, listing_id);

    // Audit log
    db.prepare(`
      INSERT INTO system_audit_logs (id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, 'PHOTOS_APPROVED', 'listing', ?, ?, '127.0.0.1', ?)
    `).run(
      `audit-${Date.now()}`,
      listing_id,
      `Đã phê duyệt bộ ${approvedList.length} ảnh cho tin đăng "${listing.title}". Ghi chú: ${notes || 'Chấp thuận bộ ảnh AI gợi ý'}.`,
      now
    );

    res.json({
      success: true,
      message: `Đã lưu bộ ${approvedList.length} ảnh được phê duyệt cho tin đăng.`,
      listing_id,
      approved_photo_ids: approvedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. AI Chatbot Assistant Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tin nhắn hội thoại.' });
    }

    const response = await aiService.chatWithAI(messages, context);
    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
