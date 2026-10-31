/**
 * Phase 4: Automation Rules API
 */

const express = require('express');
const router = express.Router();
const automationEngine = require('../automationEngine');

router.get('/rules', (req, res) => {
  try {
    const rules = automationEngine.getRules();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules', (req, res) => {
  try {
    const created = automationEngine.createRule(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rules/:id', (req, res) => {
  try {
    const updated = automationEngine.updateRule(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rules/:id', (req, res) => {
  try {
    const result = automationEngine.deleteRule(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules/:id/toggle', (req, res) => {
  try {
    const { is_enabled } = req.body;
    const updated = automationEngine.toggleRule(req.params.id, is_enabled);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules/:id/test', async (req, res) => {
  try {
    const result = await automationEngine.testRunRule(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = automationEngine.getLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
