const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateListingLocation, checkChannelLocationMatch } = require('../locationValidator');

// Validate a listing or draft location
router.post('/validate', (req, res) => {
  try {
    const listing = req.body;
    const result = validateListingLocation(listing);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check compatibility between listing location and channel
router.post('/check-channel-match', (req, res) => {
  try {
    const { listing, channel } = req.body;
    if (!listing || !channel) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin listing hoặc channel.' });
    }
    const result = checkChannelLocationMatch(listing, channel);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List reference projects
router.get('/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM location_reference_projects ORDER BY project_name ASC').all();
    const formatted = projects.map(p => ({
      ...p,
      aliases: JSON.parse(p.aliases || '[]'),
      expected_property_types: JSON.parse(p.expected_property_types || '[]')
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a reference project
router.post('/projects', (req, res) => {
  try {
    const { project_name, aliases, province, district, ward, expected_property_types, notes } = req.body;
    if (!project_name || !province || !district) {
      return res.status(400).json({ success: false, error: 'Tên dự án, Tỉnh/Thành và Quận/Huyện là bắt buộc.' });
    }

    const id = `proj-${Date.now()}`;
    const insertStmt = db.prepare(`
      INSERT INTO location_reference_projects (
        id, project_name, aliases, province, district, ward, expected_property_types, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      project_name.trim(),
      JSON.stringify(Array.isArray(aliases) ? aliases : []),
      province.trim(),
      district.trim(),
      ward ? ward.trim() : null,
      JSON.stringify(Array.isArray(expected_property_types) ? expected_property_types : []),
      notes || null,
      new Date().toISOString()
    );

    res.json({ success: true, data: { id, project_name, province, district, ward } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete reference project
router.delete('/projects/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM location_reference_projects WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Đã xóa dự án đối chiếu.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
