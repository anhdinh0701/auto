/**
 * Phase 4: Lead Management / CRM Routes
 * Manages customer pipeline, care activities, appointment reminders,
 * and CSV import/export with duplicate protection.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// 1. Get All Leads with Filters & Search
router.get('/', (req, res) => {
  try {
    const {
      status,
      search = '',
      listing_id,
      channel_id,
      property_type,
      sort_by = 'created_desc',
      page = 1,
      limit = 20
    } = req.query;

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('l.status = ?');
      params.push(status);
    }
    if (listing_id && listing_id !== 'all') {
      conditions.push('l.listing_id = ?');
      params.push(listing_id);
    }
    if (channel_id && channel_id !== 'all') {
      conditions.push('l.source_channel_id = ?');
      params.push(channel_id);
    }
    if (property_type && property_type !== 'all') {
      conditions.push('l.property_type_interest = ?');
      params.push(property_type);
    }
    if (search.trim()) {
      conditions.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.code LIKE ? OR l.notes LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY datetime(l.created_at) DESC';
    if (sort_by === 'followup_asc') orderClause = 'ORDER BY datetime(l.next_followup_at) ASC NULLS LAST';
    if (sort_by === 'name_asc') orderClause = 'ORDER BY l.name ASC';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM leads l ${whereClause}`).get(...params);
    const total = countRow.total;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT l.*, list.title as listing_title, c.name as channel_name, c.channel_type
      FROM leads l
      LEFT JOIN listings list ON l.listing_id = list.id
      LEFT JOIN channels c ON l.source_channel_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const items = db.prepare(query).all(...params, limitNum, offset);

    // Summary counts by status
    const statusCounts = {
      all: total,
      new: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'new'").get().c,
      contacting: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'contacting'").get().c,
      consulting: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'consulting'").get().c,
      scheduled_viewing: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'scheduled_viewing'").get().c,
      deal_won: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'deal_won'").get().c,
      deal_lost: db.prepare("SELECT COUNT(*) as c FROM leads WHERE status = 'deal_lost'").get().c
    };

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      statusCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Upcoming Follow-up Reminders
router.get('/reminders/upcoming', (req, res) => {
  try {
    const now = new Date().toISOString();
    const futureLimit = new Date(Date.now() + 48 * 3600000).toISOString(); // Next 48 hours

    const reminders = db.prepare(`
      SELECT l.*, list.title as listing_title, c.name as channel_name
      FROM leads l
      LEFT JOIN listings list ON l.listing_id = list.id
      LEFT JOIN channels c ON l.source_channel_id = c.id
      WHERE l.next_followup_at IS NOT NULL
        AND datetime(l.next_followup_at) <= datetime(?)
        AND l.status NOT IN ('deal_won', 'deal_lost')
      ORDER BY datetime(l.next_followup_at) ASC
      LIMIT 10
    `).all(futureLimit);

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Lead with Full Activity History
router.get('/:id', (req, res) => {
  try {
    const lead = db.prepare(`
      SELECT l.*, list.title as listing_title, c.name as channel_name
      FROM leads l
      LEFT JOIN listings list ON l.listing_id = list.id
      LEFT JOIN channels c ON l.source_channel_id = c.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!lead) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });

    const activities = db.prepare(`
      SELECT * FROM lead_activities
      WHERE lead_id = ?
      ORDER BY datetime(performed_at) DESC, datetime(created_at) DESC
    `).all(req.params.id);

    res.json({
      ...lead,
      activities
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create Lead
router.post('/', (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      zalo,
      source_channel_id,
      source_platform,
      listing_id,
      property_type_interest,
      location_interest,
      budget_min,
      budget_max,
      budget_text,
      status = 'new',
      notes = '',
      next_followup_at
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Họ và tên khách hàng không được để trống.' });
    }

    // Check duplicate by phone if phone is provided
    if (phone && phone.trim()) {
      const existing = db.prepare('SELECT id, name FROM leads WHERE phone = ?').get(phone.trim());
      if (existing) {
        return res.status(409).json({
          error: `Số điện thoại ${phone} đã tồn tại cho khách hàng "${existing.name}". Vui lòng cập nhật khách hàng này thay vì tạo mới.`,
          existing_id: existing.id
        });
      }
    }

    const id = 'lead-' + uuidv4().substr(0, 8);
    const countTotal = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
    const code = `KH-${1000 + countTotal + 1}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO leads (
        id, code, name, phone, email, zalo, source_channel_id, source_platform,
        listing_id, property_type_interest, location_interest, budget_min, budget_max,
        budget_text, status, notes, next_followup_at, created_at, updated_at
      ) VALUES (
        @id, @code, @name, @phone, @email, @zalo, @source_channel_id, @source_platform,
        @listing_id, @property_type_interest, @location_interest, @budget_min, @budget_max,
        @budget_text, @status, @notes, @next_followup_at, @now, @now
      )
    `).run({
      id,
      code,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      zalo: zalo ? zalo.trim() : null,
      source_channel_id: source_channel_id || null,
      source_platform: source_platform || 'Trực tiếp',
      listing_id: listing_id || null,
      property_type_interest: property_type_interest || null,
      location_interest: location_interest || null,
      budget_min: budget_min ? parseFloat(budget_min) : null,
      budget_max: budget_max ? parseFloat(budget_max) : null,
      budget_text: budget_text || '',
      status: status || 'new',
      notes: notes || '',
      next_followup_at: next_followup_at || null,
      now
    });

    // Create initial activity log
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, summary, details, performed_at, created_at)
      VALUES (?, ?, 'note', 'Khách hàng mới được thêm vào hệ thống', ?, ?, ?)
    `).run('act-' + uuidv4().substr(0, 8), id, `Nguồn: ${source_platform || 'Trực tiếp'}. Ghi chú: ${notes || 'Không có'}`, now, now);

    const created = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Lead
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy khách hàng.' });

    const {
      name,
      phone,
      email,
      zalo,
      source_channel_id,
      source_platform,
      listing_id,
      property_type_interest,
      location_interest,
      budget_min,
      budget_max,
      budget_text,
      status,
      notes,
      next_followup_at
    } = req.body;

    const now = new Date().toISOString();

    // Log status change activity if changed
    if (status && status !== existing.status) {
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, activity_type, summary, details, performed_at, created_at)
        VALUES (?, ?, 'status_change', ?, ?, ?, ?)
      `).run(
        'act-' + uuidv4().substr(0, 8),
        id,
        `Chuyển trạng thái: ${existing.status} ➔ ${status}`,
        `Cập nhật tiến độ chăm sóc khách hàng`,
        now,
        now
      );
    }

    db.prepare(`
      UPDATE leads SET
        name = @name,
        phone = @phone,
        email = @email,
        zalo = @zalo,
        source_channel_id = @source_channel_id,
        source_platform = @source_platform,
        listing_id = @listing_id,
        property_type_interest = @property_type_interest,
        location_interest = @location_interest,
        budget_min = @budget_min,
        budget_max = @budget_max,
        budget_text = @budget_text,
        status = @status,
        notes = @notes,
        next_followup_at = @next_followup_at,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      name: name !== undefined ? name.trim() : existing.name,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
      email: email !== undefined ? (email ? email.trim() : null) : existing.email,
      zalo: zalo !== undefined ? (zalo ? zalo.trim() : null) : existing.zalo,
      source_channel_id: source_channel_id !== undefined ? source_channel_id : existing.source_channel_id,
      source_platform: source_platform !== undefined ? source_platform : existing.source_platform,
      listing_id: listing_id !== undefined ? listing_id : existing.listing_id,
      property_type_interest: property_type_interest !== undefined ? property_type_interest : existing.property_type_interest,
      location_interest: location_interest !== undefined ? location_interest : existing.location_interest,
      budget_min: budget_min !== undefined ? (budget_min ? parseFloat(budget_min) : null) : existing.budget_min,
      budget_max: budget_max !== undefined ? (budget_max ? parseFloat(budget_max) : null) : existing.budget_max,
      budget_text: budget_text !== undefined ? budget_text : existing.budget_text,
      status: status !== undefined ? status : existing.status,
      notes: notes !== undefined ? notes : existing.notes,
      next_followup_at: next_followup_at !== undefined ? next_followup_at : existing.next_followup_at,
      updated_at: now
    });

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Lead
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM lead_activities WHERE lead_id = ?').run(req.params.id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Add Activity to Lead
router.post('/:id/activities', (req, res) => {
  try {
    const leadId = req.params.id;
    const { activity_type = 'call', summary, details = '', performed_at } = req.body;

    if (!summary || !summary.trim()) {
      return res.status(400).json({ error: 'Tiêu đề hoạt động không được để trống.' });
    }

    const id = 'act-' + uuidv4().substr(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, summary, details, performed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      leadId,
      activity_type,
      summary.trim(),
      details || '',
      performed_at || now,
      now
    );

    // Update lead's updated_at
    db.prepare('UPDATE leads SET updated_at = ? WHERE id = ?').run(now, leadId);

    const created = db.prepare('SELECT * FROM lead_activities WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Export Leads to CSV with UTF-8 BOM
router.get('/export/csv', (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT l.*, list.title as listing_title, c.name as channel_name
      FROM leads l
      LEFT JOIN listings list ON l.listing_id = list.id
      LEFT JOIN channels c ON l.source_channel_id = c.id
      ORDER BY datetime(l.created_at) DESC
    `).all();

    const headers = ['Mã KH', 'Họ Tên', 'Số Điện Thoại', 'Email', 'Zalo', 'Nguồn', 'Tin Đăng Liên Quan', 'Nhu Cầu Loại Hình', 'Khu Vực', 'Ngân Sách', 'Trạng Thái', 'Lịch Hẹn Tiếp', 'Ghi Chú'];
    const rows = leads.map(l => [
      l.code,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      l.phone || '',
      l.email || '',
      l.zalo || '',
      `"${(l.source_platform || l.channel_name || '').replace(/"/g, '""')}"`,
      `"${(l.listing_title || '').replace(/"/g, '""')}"`,
      l.property_type_interest || '',
      `"${(l.location_interest || '').replace(/"/g, '""')}"`,
      `"${(l.budget_text || '').replace(/"/g, '""')}"`,
      l.status || 'new',
      l.next_followup_at || '',
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const fileBuffer = Buffer.concat([bomBuffer, Buffer.from(csvContent, 'utf8')]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="danh_sach_khach_hang_leads.csv"');
    res.send(fileBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Import Leads from CSV with Duplicate Handling
router.post('/import/csv', express.text({ type: '*/*', limit: '10mb' }), (req, res) => {
  try {
    const csvData = typeof req.body === 'string' ? req.body : (req.body.csvData || '');
    if (!csvData || !csvData.trim()) {
      return res.status(400).json({ error: 'Nội dung CSV không được để trống.' });
    }

    const lines = csvData.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'Tệp CSV không có dữ liệu hàng.' });
    }

    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO leads (
        id, code, name, phone, email, zalo, source_platform, property_type_interest,
        location_interest, budget_text, status, notes, created_at, updated_at
      ) VALUES (
        @id, @code, @name, @phone, @email, @zalo, @source_platform, @property_type_interest,
        @location_interest, @budget_text, @status, @notes, @now, @now
      )
    `);

    db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const name = parts[0] || parts[1]; // Flexible header detection
        const phone = parts[1] && parts[1].match(/\d{9,11}/) ? parts[1] : (parts[2] && parts[2].match(/\d{9,11}/) ? parts[2] : '');
        const email = parts[2] && parts[2].includes('@') ? parts[2] : (parts[3] && parts[3].includes('@') ? parts[3] : '');

        if (!name || name.length < 2) {
          skipped++;
          continue;
        }

        // Duplicate check
        if (phone) {
          const exists = db.prepare('SELECT id FROM leads WHERE phone = ?').get(phone);
          if (exists) {
            duplicates++;
            continue;
          }
        }

        const countTotal = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
        const code = `KH-${1000 + countTotal + 1}`;
        const id = 'lead-' + uuidv4().substr(0, 8);

        insertStmt.run({
          id,
          code,
          name,
          phone: phone || null,
          email: email || null,
          zalo: phone || null,
          source_platform: 'CSV Import',
          property_type_interest: parts[4] || null,
          location_interest: parts[5] || null,
          budget_text: parts[6] || null,
          status: 'new',
          notes: 'Nhập khẩu từ tệp CSV',
          now
        });

        imported++;
      }
    })();

    res.json({
      success: true,
      imported,
      skipped,
      duplicates,
      message: `Nhập CSV hoàn tất: Đã thêm ${imported} khách hàng mới, bỏ qua ${duplicates} số điện thoại trùng lặp.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xử lý CSV: ' + err.message });
  }
});

module.exports = router;
