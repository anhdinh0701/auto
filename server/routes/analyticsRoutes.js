/**
 * Phase 4: Analytics Dashboard Routes
 * Aggregates multi-channel real estate performance, conversion metrics,
 * channel comparisons, and manual analytics entry with transparency.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const automationEngine = require('../automationEngine');

// 1. Unified Analytics Dashboard API
router.get('/dashboard', (req, res) => {
  try {
    const {
      time_range = '30days',
      from_date,
      to_date,
      listing_id,
      channel_id,
      status
    } = req.query;

    // Determine date boundary
    let startDate = null;
    let endDate = new Date().toISOString();

    const now = new Date();
    if (time_range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (time_range === '7days') {
      startDate = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (time_range === '30days') {
      startDate = new Date(Date.now() - 30 * 86400000).toISOString();
    } else if (time_range === '90days') {
      startDate = new Date(Date.now() - 90 * 86400000).toISOString();
    } else if (time_range === 'custom' && from_date) {
      startDate = new Date(from_date).toISOString();
      if (to_date) endDate = new Date(to_date).toISOString();
    }

    // Build publishing tasks query filters
    const taskConditions = [];
    const taskParams = [];

    if (startDate) {
      taskConditions.push('datetime(t.created_at) >= datetime(?)');
      taskParams.push(startDate);
    }
    if (endDate) {
      taskConditions.push('datetime(t.created_at) <= datetime(?)');
      taskParams.push(endDate);
    }
    if (listing_id && listing_id !== 'all') {
      taskConditions.push('t.listing_id = ?');
      taskParams.push(listing_id);
    }
    if (channel_id && channel_id !== 'all') {
      taskConditions.push('t.channel_id = ?');
      taskParams.push(channel_id);
    }
    if (status && status !== 'all') {
      taskConditions.push('t.status = ?');
      taskParams.push(status);
    }

    const taskWhere = taskConditions.length > 0 ? `WHERE ${taskConditions.join(' AND ')}` : '';

    // Task Summary Counts
    const allFilteredTasks = db.prepare(`
      SELECT t.*, c.name as channel_name, c.channel_type, l.property_type, l.province, l.district
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      LEFT JOIN listings l ON t.listing_id = l.id
      ${taskWhere}
    `).all(...taskParams);

    const totalPosts = allFilteredTasks.length;
    const publishedCount = allFilteredTasks.filter(t => t.status === 'published').length;
    const failedCount = allFilteredTasks.filter(t => t.status === 'failed').length;
    const scheduledCount = allFilteredTasks.filter(t => t.status === 'scheduled').length;
    const queuedCount = allFilteredTasks.filter(t => ['queued', 'publishing'].includes(t.status)).length;
    const needsManualCount = allFilteredTasks.filter(t => t.status === 'needs_manual_action').length;
    const draftCount = allFilteredTasks.filter(t => t.status === 'draft').length;

    const denominator = publishedCount + failedCount;
    const successRate = denominator > 0 ? Math.round((publishedCount / denominator) * 100) : (totalPosts > 0 ? 100 : 0);

    // Error Breakdown
    const errorMap = {};
    allFilteredTasks.filter(t => t.status === 'failed').forEach(t => {
      const code = t.error_code || 'PUBLISH_ERROR';
      if (!errorMap[code]) {
        errorMap[code] = { code, count: 0, sample_message: t.error_message || '' };
      }
      errorMap[code].count++;
    });
    const errorBreakdown = Object.values(errorMap).sort((a, b) => b.count - a.count);

    // Performance Metrics from post_analytics
    const analyticsConditions = [];
    const analyticsParams = [];
    if (startDate) {
      analyticsConditions.push('datetime(recorded_at) >= datetime(?)');
      analyticsParams.push(startDate);
    }
    if (listing_id && listing_id !== 'all') {
      analyticsConditions.push('listing_id = ?');
      analyticsParams.push(listing_id);
    }
    if (channel_id && channel_id !== 'all') {
      analyticsConditions.push('channel_id = ?');
      analyticsParams.push(channel_id);
    }
    const analyticsWhere = analyticsConditions.length > 0 ? `WHERE ${analyticsConditions.join(' AND ')}` : '';

    const analyticsRows = db.prepare(`
      SELECT a.*, c.name as channel_name, c.channel_type, l.title as listing_title, l.property_type, l.province, l.district
      FROM post_analytics a
      LEFT JOIN channels c ON a.channel_id = c.id
      LEFT JOIN listings l ON a.listing_id = l.id
      ${analyticsWhere}
    `).all(...analyticsParams);

    const totalViews = analyticsRows.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalInteractions = analyticsRows.reduce((sum, r) => sum + (r.interactions || 0), 0);
    const totalLeads = analyticsRows.reduce((sum, r) => sum + (r.leads_count || 0), 0);
    const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(2) : 0;

    const sourceBreakdown = {
      platform: analyticsRows.filter(r => r.data_source === 'platform').length,
      manual: analyticsRows.filter(r => r.data_source === 'manual').length,
      unavailable: Math.max(0, publishedCount - analyticsRows.length)
    };

    // Channel Comparison
    const channelMap = {};
    allFilteredTasks.forEach(t => {
      const cId = t.channel_id || 'unknown';
      if (!channelMap[cId]) {
        channelMap[cId] = {
          channel_id: cId,
          channel_name: t.channel_name || 'Kênh khác',
          channel_type: t.channel_type || 'other',
          posts: 0,
          views: 0,
          interactions: 0,
          leads: 0
        };
      }
      channelMap[cId].posts++;
    });

    analyticsRows.forEach(a => {
      const cId = a.channel_id || 'unknown';
      if (!channelMap[cId]) {
        channelMap[cId] = {
          channel_id: cId,
          channel_name: a.channel_name || 'Kênh khác',
          channel_type: a.channel_type || 'other',
          posts: 0,
          views: 0,
          interactions: 0,
          leads: 0
        };
      }
      channelMap[cId].views += (a.views || 0);
      channelMap[cId].interactions += (a.interactions || 0);
      channelMap[cId].leads += (a.leads_count || 0);
    });

    const channelComparison = Object.values(channelMap).map(c => ({
      ...c,
      conversion_rate: c.views > 0 ? ((c.leads / c.views) * 100).toFixed(1) : 0
    })).sort((a, b) => b.posts - a.posts);

    // Property Type Comparison
    const typeLabels = {
      can_ho: 'Căn hộ chung cư',
      nha_pho: 'Nhà phố',
      nha_rieng: 'Nhà riêng',
      dat_nen: 'Đất nền',
      biet_thu: 'Biệt thự',
      van_phong: 'Văn phòng'
    };

    const typeMap = {};
    allFilteredTasks.forEach(t => {
      const pType = t.property_type || 'khac';
      if (!typeMap[pType]) {
        typeMap[pType] = {
          property_type: pType,
          label: typeLabels[pType] || pType,
          posts: 0,
          views: 0,
          leads: 0
        };
      }
      typeMap[pType].posts++;
    });

    analyticsRows.forEach(a => {
      const pType = a.property_type || 'khac';
      if (!typeMap[pType]) {
        typeMap[pType] = {
          property_type: pType,
          label: typeLabels[pType] || pType,
          posts: 0,
          views: 0,
          leads: 0
        };
      }
      typeMap[pType].views += (a.views || 0);
      typeMap[pType].leads += (a.leads_count || 0);
    });

    const propertyTypeComparison = Object.values(typeMap).sort((a, b) => b.posts - a.posts);

    // Location Comparison
    const locMap = {};
    allFilteredTasks.forEach(t => {
      const locKey = [t.district, t.province].filter(Boolean).join(', ') || 'Chưa phân bổ';
      if (!locMap[locKey]) {
        locMap[locKey] = { location: locKey, posts: 0, views: 0, leads: 0 };
      }
      locMap[locKey].posts++;
    });

    analyticsRows.forEach(a => {
      const locKey = [a.district, a.province].filter(Boolean).join(', ') || 'Chưa phân bổ';
      if (!locMap[locKey]) {
        locMap[locKey] = { location: locKey, posts: 0, views: 0, leads: 0 };
      }
      locMap[locKey].views += (a.views || 0);
      locMap[locKey].leads += (a.leads_count || 0);
    });

    const locationComparison = Object.values(locMap).sort((a, b) => b.posts - a.posts).slice(0, 6);

    // Daily Timeline Trends (last 14 days or filtered period)
    const trendMap = {};
    const daysCount = 14;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = {
        date: dateStr,
        display_date: `${d.getDate()}/${d.getMonth() + 1}`,
        published: 0,
        failed: 0,
        views: 0,
        leads: 0
      };
    }

    allFilteredTasks.forEach(t => {
      const dateStr = (t.completed_at || t.created_at || '').split('T')[0];
      if (trendMap[dateStr]) {
        if (t.status === 'published') trendMap[dateStr].published++;
        else if (t.status === 'failed') trendMap[dateStr].failed++;
      }
    });

    analyticsRows.forEach(a => {
      const dateStr = (a.recorded_at || '').split('T')[0];
      if (trendMap[dateStr]) {
        trendMap[dateStr].views += (a.views || 0);
        trendMap[dateStr].leads += (a.leads_count || 0);
      }
    });

    const trends = Object.values(trendMap);

    res.json({
      summary: {
        total_posts: totalPosts,
        published: publishedCount,
        failed: failedCount,
        scheduled: scheduledCount,
        queued: queuedCount,
        needs_manual: needsManualCount,
        draft: draftCount,
        success_rate: successRate
      },
      performance: {
        total_views: totalViews,
        total_interactions: totalInteractions,
        total_leads: totalLeads,
        conversion_rate: parseFloat(conversionRate)
      },
      data_sources: sourceBreakdown,
      channel_comparison: channelComparison,
      property_type_comparison: propertyTypeComparison,
      location_comparison: locationComparison,
      trends: trends,
      error_breakdown: errorBreakdown
    });
  } catch (err) {
    console.error('Analytics dashboard error:', err);
    res.status(500).json({ error: 'Lỗi tải dữ liệu Analytics: ' + err.message });
  }
});

// 2. Manual Analytics Entry (For channels without platform insights API)
router.post('/manual-entry', (req, res) => {
  try {
    const {
      task_id = null,
      listing_id = null,
      channel_id = null,
      views = 0,
      interactions = 0,
      leads_count = 0,
      notes = ''
    } = req.body;

    if (!listing_id && !task_id) {
      return res.status(400).json({ error: 'Cần cung cấp tin bất động sản hoặc mã tác vụ xuất bản.' });
    }

    const id = 'stat-' + uuidv4().substr(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO post_analytics (
        id, task_id, listing_id, channel_id, views, interactions, leads_count,
        data_source, notes, recorded_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?
      )
    `).run(
      id,
      task_id || null,
      listing_id || null,
      channel_id || null,
      parseInt(views, 10) || 0,
      parseInt(interactions, 10) || 0,
      parseInt(leads_count, 10) || 0,
      notes || 'Nhập thủ công',
      now,
      now
    );

    // Trigger automation event
    automationEngine.triggerEvent('analytics_updated', {
      entry_id: id,
      views,
      leads_count
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu số liệu hiệu quả thủ công thành công!',
      id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Recent Analytics Entries
router.get('/entries', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, l.title as listing_title, c.name as channel_name, c.channel_type
      FROM post_analytics a
      LEFT JOIN listings l ON a.listing_id = l.id
      LEFT JOIN channels c ON a.channel_id = c.id
      ORDER BY datetime(a.recorded_at) DESC
      LIMIT 20
    `).all();

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
