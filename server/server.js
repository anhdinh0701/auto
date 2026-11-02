const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { calculateRelevance } = require('./scoring');
const channelSearchProvider = require('./providers/channelSearchProvider');
const scheduler = require('./scheduler');
const dedicatedPostingAgent = require('./dedicatedPostingAgent');
const chromeStationService = require('./chromeStationService');
const chromePublishService = require('./chromePublishService');
const multiGroupQueueService = require('./multiGroupQueueService');
const connectorRegistry = require('./connectors/ConnectorRegistry');
const { validateListingLocation, checkChannelLocationMatch } = require('./locationValidator');
const { uploadsDir, getAbsoluteMediaPath } = require('./mediaHelper');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 1. Direct static serving for uploads directory & error logs
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

const errorLogsDir = path.resolve(__dirname, '..', 'logs', 'errors');
if (!fs.existsSync(errorLogsDir)) {
  fs.mkdirSync(errorLogsDir, { recursive: true });
}
app.use('/logs/errors', express.static(errorLogsDir));

// 2. Intelligent fallback handler: resolve original names, un-prefixed names or partial matches
app.get('/uploads/:filename', (req, res, next) => {
  try {
    const rawFilename = req.params.filename;
    const absPath = getAbsoluteMediaPath(rawFilename);
    if (absPath && fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      return res.sendFile(absPath);
    }
  } catch (_) {}
  next();
});

// 3. Explicit 404 handler for missing static uploads
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'IMAGE_NOT_FOUND',
    message: `Tệp hình ảnh không tồn tại trên máy chủ: ${req.path}`,
    requested_path: req.originalUrl
  });
});

// Multer storage configuration - preserves original quality and unique naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${cleanBase}${ext}`);
  }
});

// File filter: only images (JPEG, PNG, WEBP, GIF), max 10MB each
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các tệp hình ảnh định dạng JPEG, PNG, WEBP hoặc GIF!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 30 // Max 30 files in single upload
  }
});

// Helper to format listing row for JSON responses
function formatListing(row) {
  if (!row) return null;
  return {
    ...row,
    project_name: row.project_name || '',
    location_verification_status: row.location_verification_status || 'UNVERIFIED',
    location_mismatch_details: row.location_mismatch_details || '',
    approved_photo_ids: typeof row.approved_photo_ids === 'string' ? JSON.parse(row.approved_photo_ids || '[]') : (row.approved_photo_ids || []),
    content_versions: typeof row.content_versions === 'string' ? JSON.parse(row.content_versions || '[]') : (row.content_versions || []),
    amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities || '[]') : row.amenities,
    photos: typeof row.photos === 'string' ? JSON.parse(row.photos || '[]') : row.photos,
    target_platforms: typeof row.target_platforms === 'string' ? JSON.parse(row.target_platforms || '[]') : row.target_platforms,
    target_groups: typeof row.target_groups === 'string' ? JSON.parse(row.target_groups || '[]') : row.target_groups,
    publish_logs: typeof row.publish_logs === 'string' ? JSON.parse(row.publish_logs || '[]') : row.publish_logs
  };
}

// ---------------- ROUTES ---------------- //

// 1. Dashboard Stats
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM listings').get().count;
    const drafts = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'draft'").get().count;
    const ready = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'ready'").get().count;
    const reviewed = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'reviewed'").get().count;
    const totalPhotos = db.prepare('SELECT COUNT(*) as count FROM photos').get().count;

    const recent = db.prepare(`
      SELECT * FROM listings 
      ORDER BY datetime(updated_at) DESC 
      LIMIT 5
    `).all().map(formatListing);

    res.json({
      total,
      drafts,
      ready,
      reviewed,
      totalPhotos,
      recent
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu thống kê: ' + error.message });
  }
});

// 2. Get Listings with Search, Filters, Pagination
app.get('/api/listings', (req, res) => {
  try {
    const {
      search = '',
      property_type = '',
      status = '',
      listing_action = '',
      sort_by = 'updated_desc',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (search.trim()) {
      conditions.push('(title LIKE ? OR address_detail LIKE ? OR district LIKE ? OR province LIKE ? OR description LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (property_type && property_type !== 'all') {
      conditions.push('property_type = ?');
      params.push(property_type);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (listing_action && listing_action !== 'all') {
      conditions.push('listing_action = ?');
      params.push(listing_action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY datetime(updated_at) DESC';
    if (sort_by === 'created_desc') orderClause = 'ORDER BY datetime(created_at) DESC';
    if (sort_by === 'price_asc') orderClause = 'ORDER BY price ASC';
    if (sort_by === 'price_desc') orderClause = 'ORDER BY price DESC';
    if (sort_by === 'area_desc') orderClause = 'ORDER BY area DESC';

    const countQuery = `SELECT COUNT(*) as total FROM listings ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    const itemsQuery = `
      SELECT * FROM listings 
      ${whereClause} 
      ${orderClause} 
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(itemsQuery).all(...params, parseInt(limit, 10), offset);
    const items = rows.map(formatListing);

    res.json({
      items,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1
    });
  } catch (error) {
    console.error('Listings get error:', error);
    res.status(500).json({ error: 'Lỗi khi tải danh sách tin: ' + error.message });
  }
});

// 3. Get Single Listing
app.get('/api/listings/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy tin bất động sản này.' });
    }
    res.json(formatListing(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create Listing
app.post('/api/listings', (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề tin bất động sản không được để trống.' });
    }

    const id = data.id || `listing-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    // Auto location validation
    const locValidation = validateListingLocation({
      project_name: data.project_name || '',
      province: data.province || '',
      district: data.district || '',
      ward: data.ward || '',
      address_detail: data.address_detail || '',
      title: data.title || '',
      description: data.description || ''
    });

    const insertStmt = db.prepare(`
      INSERT INTO listings (
        id, title, description, property_type, listing_action, province, district, ward,
        address_detail, price, price_unit, price_raw_text, area, bedrooms, bathrooms, floors,
        direction, legal_status, furniture_status, amenities, contact_name, contact_phone,
        contact_zalo, contact_note, map_url, detail_url, status, photos, target_platforms,
        target_groups, scheduled_at, publish_queue_status, publish_logs, project_name,
        location_verification_status, location_mismatch_details, approved_photo_ids, content_versions,
        created_at, updated_at
      ) VALUES (
        @id, @title, @description, @property_type, @listing_action, @province, @district, @ward,
        @address_detail, @price, @price_unit, @price_raw_text, @area, @bedrooms, @bathrooms, @floors,
        @direction, @legal_status, @furniture_status, @amenities, @contact_name, @contact_phone,
        @contact_zalo, @contact_note, @map_url, @detail_url, @status, @photos, @target_platforms,
        @target_groups, @scheduled_at, @publish_queue_status, @publish_logs, @project_name,
        @location_verification_status, @location_mismatch_details, @approved_photo_ids, @content_versions,
        @created_at, @updated_at
      )
    `);

    const record = {
      id,
      title: data.title.trim(),
      description: data.description || '',
      property_type: data.property_type || 'can_ho',
      listing_action: data.listing_action || 'ban',
      province: data.province || '',
      district: data.district || '',
      ward: data.ward || '',
      address_detail: data.address_detail || '',
      price: data.price ? parseFloat(data.price) : null,
      price_unit: data.price_unit || 'tỷ',
      price_raw_text: data.price_raw_text || '',
      area: data.area ? parseFloat(data.area) : null,
      bedrooms: data.bedrooms !== undefined && data.bedrooms !== '' ? parseInt(data.bedrooms, 10) : null,
      bathrooms: data.bathrooms !== undefined && data.bathrooms !== '' ? parseInt(data.bathrooms, 10) : null,
      floors: data.floors !== undefined && data.floors !== '' ? parseInt(data.floors, 10) : null,
      direction: data.direction || '',
      legal_status: data.legal_status || '',
      furniture_status: data.furniture_status || '',
      amenities: JSON.stringify(Array.isArray(data.amenities) ? data.amenities : []),
      contact_name: data.contact_name || '',
      contact_phone: data.contact_phone || '',
      contact_zalo: data.contact_zalo || '',
      contact_note: data.contact_note || '',
      map_url: data.map_url || '',
      detail_url: data.detail_url || '',
      status: data.status || 'draft',
      photos: JSON.stringify(Array.isArray(data.photos) ? data.photos : []),
      target_platforms: JSON.stringify(Array.isArray(data.target_platforms) ? data.target_platforms : []),
      target_groups: JSON.stringify(Array.isArray(data.target_groups) ? data.target_groups : []),
      scheduled_at: data.scheduled_at || null,
      publish_queue_status: data.publish_queue_status || 'idle',
      publish_logs: JSON.stringify(Array.isArray(data.publish_logs) ? data.publish_logs : []),
      project_name: data.project_name || '',
      location_verification_status: locValidation.status,
      location_mismatch_details: locValidation.reasons.join(' | '),
      approved_photo_ids: JSON.stringify(Array.isArray(data.approved_photo_ids) ? data.approved_photo_ids : []),
      content_versions: JSON.stringify(Array.isArray(data.content_versions) ? data.content_versions : []),
      created_at: now,
      updated_at: now
    };

    insertStmt.run(record);

    const created = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    res.status(201).json(formatListing(created));
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo tin: ' + error.message });
  }
});

// 5. Update Listing
app.put('/api/listings/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tin bất động sản cần cập nhật.' });
    }

    const data = req.body;
    if (!data.title || !data.title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề không được để trống.' });
    }

    const now = new Date().toISOString();

    const locValidation = validateListingLocation({
      project_name: data.project_name !== undefined ? data.project_name : existing.project_name,
      province: data.province !== undefined ? data.province : existing.province,
      district: data.district !== undefined ? data.district : existing.district,
      ward: data.ward !== undefined ? data.ward : existing.ward,
      address_detail: data.address_detail !== undefined ? data.address_detail : existing.address_detail,
      title: data.title || existing.title,
      description: data.description || existing.description
    });

    const updateStmt = db.prepare(`
      UPDATE listings SET
        title = @title,
        description = @description,
        property_type = @property_type,
        listing_action = @listing_action,
        province = @province,
        district = @district,
        ward = @ward,
        address_detail = @address_detail,
        price = @price,
        price_unit = @price_unit,
        price_raw_text = @price_raw_text,
        area = @area,
        bedrooms = @bedrooms,
        bathrooms = @bathrooms,
        floors = @floors,
        direction = @direction,
        legal_status = @legal_status,
        furniture_status = @furniture_status,
        amenities = @amenities,
        contact_name = @contact_name,
        contact_phone = @contact_phone,
        contact_zalo = @contact_zalo,
        contact_note = @contact_note,
        map_url = @map_url,
        detail_url = @detail_url,
        status = @status,
        photos = @photos,
        target_platforms = @target_platforms,
        target_groups = @target_groups,
        scheduled_at = @scheduled_at,
        publish_queue_status = @publish_queue_status,
        publish_logs = @publish_logs,
        project_name = @project_name,
        location_verification_status = @location_verification_status,
        location_mismatch_details = @location_mismatch_details,
        approved_photo_ids = @approved_photo_ids,
        content_versions = @content_versions,
        updated_at = @updated_at
      WHERE id = @id
    `);

    updateStmt.run({
      id,
      title: data.title.trim(),
      description: data.description || '',
      property_type: data.property_type || existing.property_type,
      listing_action: data.listing_action || existing.listing_action,
      province: data.province !== undefined ? data.province : existing.province,
      district: data.district !== undefined ? data.district : existing.district,
      ward: data.ward !== undefined ? data.ward : existing.ward,
      address_detail: data.address_detail !== undefined ? data.address_detail : existing.address_detail,
      price: data.price !== undefined && data.price !== '' ? parseFloat(data.price) : null,
      price_unit: data.price_unit || existing.price_unit,
      price_raw_text: data.price_raw_text !== undefined ? data.price_raw_text : existing.price_raw_text,
      area: data.area !== undefined && data.area !== '' ? parseFloat(data.area) : null,
      bedrooms: data.bedrooms !== undefined && data.bedrooms !== '' ? parseInt(data.bedrooms, 10) : null,
      bathrooms: data.bathrooms !== undefined && data.bathrooms !== '' ? parseInt(data.bathrooms, 10) : null,
      floors: data.floors !== undefined && data.floors !== '' ? parseInt(data.floors, 10) : null,
      direction: data.direction !== undefined ? data.direction : existing.direction,
      legal_status: data.legal_status !== undefined ? data.legal_status : existing.legal_status,
      furniture_status: data.furniture_status !== undefined ? data.furniture_status : existing.furniture_status,
      amenities: JSON.stringify(Array.isArray(data.amenities) ? data.amenities : []),
      contact_name: data.contact_name !== undefined ? data.contact_name : existing.contact_name,
      contact_phone: data.contact_phone !== undefined ? data.contact_phone : existing.contact_phone,
      contact_zalo: data.contact_zalo !== undefined ? data.contact_zalo : existing.contact_zalo,
      contact_note: data.contact_note !== undefined ? data.contact_note : existing.contact_note,
      map_url: data.map_url !== undefined ? data.map_url : existing.map_url,
      detail_url: data.detail_url !== undefined ? data.detail_url : existing.detail_url,
      status: data.status || existing.status,
      photos: JSON.stringify(Array.isArray(data.photos) ? data.photos : []),
      target_platforms: JSON.stringify(Array.isArray(data.target_platforms) ? data.target_platforms : []),
      target_groups: JSON.stringify(Array.isArray(data.target_groups) ? data.target_groups : []),
      scheduled_at: data.scheduled_at !== undefined ? data.scheduled_at : existing.scheduled_at,
      publish_queue_status: data.publish_queue_status || existing.publish_queue_status,
      publish_logs: JSON.stringify(Array.isArray(data.publish_logs) ? data.publish_logs : []),
      project_name: data.project_name !== undefined ? data.project_name : (existing.project_name || ''),
      location_verification_status: locValidation.status,
      location_mismatch_details: locValidation.reasons.join(' | '),
      approved_photo_ids: JSON.stringify(Array.isArray(data.approved_photo_ids) ? data.approved_photo_ids : (existing.approved_photo_ids ? JSON.parse(existing.approved_photo_ids) : [])),
      content_versions: JSON.stringify(Array.isArray(data.content_versions) ? data.content_versions : (existing.content_versions ? JSON.parse(existing.content_versions) : [])),
      updated_at: now
    });

    const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    res.json(formatListing(updated));
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật tin: ' + error.message });
  }
});

// 6. Delete Listing
app.delete('/api/listings/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tin bất động sản cần xóa.' });
    }
    db.prepare('DELETE FROM listings WHERE id = ?').run(id);
    res.json({ success: true, message: 'Đã xóa tin bất động sản thành công.', id });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa tin: ' + error.message });
  }
});

// 7. Clone / Duplicate Listing
app.post('/api/listings/:id/clone', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tin bất động sản cần sao chép.' });
    }

    const newId = `listing-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const cloneRecord = {
      ...existing,
      id: newId,
      title: `${existing.title} (Bản sao)`,
      status: 'draft',
      publish_queue_status: 'idle',
      scheduled_at: null,
      publish_logs: '[]',
      created_at: now,
      updated_at: now
    };

    const insertStmt = db.prepare(`
      INSERT INTO listings (
        id, title, description, property_type, listing_action, province, district, ward,
        address_detail, price, price_unit, price_raw_text, area, bedrooms, bathrooms, floors,
        direction, legal_status, furniture_status, amenities, contact_name, contact_phone,
        contact_zalo, contact_note, map_url, detail_url, status, photos, target_platforms,
        target_groups, scheduled_at, publish_queue_status, publish_logs, created_at, updated_at
      ) VALUES (
        @id, @title, @description, @property_type, @listing_action, @province, @district, @ward,
        @address_detail, @price, @price_unit, @price_raw_text, @area, @bedrooms, @bathrooms, @floors,
        @direction, @legal_status, @furniture_status, @amenities, @contact_name, @contact_phone,
        @contact_zalo, @contact_note, @map_url, @detail_url, @status, @photos, @target_platforms,
        @target_groups, @scheduled_at, @publish_queue_status, @publish_logs, @created_at, @updated_at
      )
    `);

    insertStmt.run(cloneRecord);
    const created = db.prepare('SELECT * FROM listings WHERE id = ?').get(newId);
    res.status(201).json(formatListing(created));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi nhân bản tin: ' + error.message });
  }
});

// 8. Upload Multiple Images (Multer)
app.post('/api/upload', (req, res) => {
  upload.array('images', 30)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Kích thước tệp vượt quá giới hạn 10MB cho mỗi ảnh.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Số lượng ảnh vượt quá giới hạn tối đa 30 ảnh trong một lần tải.' });
      }
      return res.status(400).json({ error: 'Lỗi tải tệp: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một ảnh để tải lên.' });
    }

    const insertedPhotos = [];
    const insertPhotoStmt = db.prepare(`
      INSERT INTO photos (id, url, filename, originalname, mimetype, size, listing_id, created_at)
      VALUES (@id, @url, @filename, @originalname, @mimetype, @size, @listing_id, @created_at)
    `);

    const now = new Date().toISOString();
    const listingId = req.body.listing_id || null;

    for (const file of req.files) {
      const photoId = 'photo-' + uuidv4().substr(0, 12);
      const url = `/uploads/${file.filename}`;
      const photoObj = {
        id: photoId,
        url: url,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        listing_id: listingId,
        created_at: now
      };

      insertPhotoStmt.run(photoObj);

      insertedPhotos.push({
        id: photoId,
        url: url,
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        is_cover: false
      });
    }

    res.json({
      success: true,
      message: `Đã tải lên thành công ${insertedPhotos.length} ảnh.`,
      photos: insertedPhotos
    });
  });
});

// Dedicated Real Photo Upload Endpoint for Single-Page Workspace
app.post('/api/upload-photos', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Chưa có tệp ảnh nào được gửi lên.' });
    }

    const savedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      url: `/uploads/${file.filename}`,
      path: getAbsoluteMediaPath(file.filename),
      size: file.size
    }));

    res.json({
      success: true,
      count: savedFiles.length,
      files: savedFiles
    });
  });
});

// ========================================================
// CORE REAL APIS: CHROME STATION & PUBLISH VIA PLAYWRIGHT CDP
// ========================================================

// 1. API GET /api/chrome/status: Kiểm tra trạng thái thời gian thực cổng 9222
app.get('/api/chrome/status', async (req, res) => {
  try {
    const status = await chromePublishService.checkStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, connected: false, isOnline: false, error: err.message });
  }
});

// 2. API POST /api/chrome/launch: Khởi động cửa sổ Google Chrome Singleton hiển thị trực tiếp
app.post('/api/chrome/launch', async (req, res) => {
  try {
    const result = await chromePublishService.openFacebookTab();
    res.json(result);
  } catch (err) {
    console.error('[API chrome/launch error]', err.message);
    res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

// API POST /api/chrome/open-facebook: Đưa tab Facebook lên trước mặt người dùng để đăng nhập
app.post('/api/chrome/open-facebook', async (req, res) => {
  try {
    const result = await chromePublishService.openFacebookTab();
    res.json(result);
  } catch (err) {
    console.error('[API chrome/open-facebook error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. API POST /api/publish: Tự động điều khiển Chrome đăng bài lên nhóm
const handlePublishRequest = async (req, res) => {
  try {
    const groupUrl = req.body.groupUrl || req.body.group_url;
    const groupUrls = req.body.groupUrls || req.body.group_urls;
    const content = req.body.content || req.body.post_content;
    const images = req.body.images || req.body.imageFilenames || req.body.image_filenames || [];
    const scheduledTime = req.body.scheduledTime || req.body.scheduled_time;
    const schedules = req.body.schedules; // Hỗ trợ mảng nhiều khung giờ với nội dung riêng
    const delayMin = req.body.delayMin || req.body.delay_min || 90;
    const delayMax = req.body.delayMax || req.body.delay_max || 180;
    const autoSpin = req.body.autoSpin !== undefined ? Boolean(req.body.autoSpin) : true;

    // Phân tích danh sách link nhóm từ groupUrls hoặc groupUrl (nếu nhập nhiều dòng)
    let urlList = [];
    if (groupUrls) {
      urlList = Array.isArray(groupUrls) ? groupUrls : String(groupUrls).split(/[\r\n,;]+/);
    } else if (groupUrl) {
      urlList = String(groupUrl).split(/[\r\n,;]+/);
    }
    urlList = Array.from(new Set(urlList.map(u => u.trim()).filter(u => u && u.includes('facebook.com'))));

    if (urlList.length === 0) {
      return res.status(400).json({ success: false, connected: false, error: 'Thiếu đường dẫn Nhóm Facebook hợp lệ (groupUrl).' });
    }

    // 1. Trường hợp lên lịch cho nhiều khung giờ (mỗi khung giờ có nội dung riêng biệt)
    if (Array.isArray(schedules) && schedules.length > 0) {
      const createdSchedules = [];
      for (const slot of schedules) {
        const slotTime = slot.scheduledTime || slot.time || slot.scheduled_time;
        const slotContent = slot.content || slot.post_content || content;
        const slotImages = slot.images || images;

        if (!slotTime || !slotContent || !slotContent.trim()) continue;

        // Lưu cho từng nhóm trong danh sách
        for (const singleUrl of urlList) {
          const scheduleResult = await dedicatedPostingAgent.executeDirectPost({
            group_url: singleUrl,
            content: slotContent.trim(),
            image_filenames: slotImages,
            scheduled_time: slotTime
          });
          createdSchedules.push(scheduleResult);
        }
      }

      return res.json({
        success: true,
        isScheduled: true,
        isBatch: true,
        count: createdSchedules.length,
        schedules: createdSchedules,
        message: `Đã lên lịch thành công cho ${createdSchedules.length} tác vụ trên ${urlList.length} nhóm Facebook!`
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, connected: false, error: 'Nội dung bài viết không được để trống.' });
    }

    // 2. Nếu đăng nhiều nhóm HOẶC yêu cầu đưa vào Hàng đợi không giới hạn (Multi-Group Queue)
    if (urlList.length > 1 || req.body.useQueue || req.body.isQueue) {
      const batchResult = multiGroupQueueService.createBatch({
        groupUrls: urlList,
        content: content.trim(),
        images,
        delayMin,
        delayMax,
        autoSpin,
        scheduledTime: scheduledTime && new Date(scheduledTime) > new Date() ? scheduledTime : null
      });

      return res.json({
        success: true,
        isQueue: true,
        batchId: batchResult.batchId,
        totalGroups: batchResult.totalGroups,
        delayMin: batchResult.delayMin,
        delayMax: batchResult.delayMax,
        message: batchResult.message
      });
    }

    // 3. Nếu hẹn 1 khung giờ đơn lẻ trong tương lai cho 1 nhóm
    if (scheduledTime && new Date(scheduledTime) > new Date()) {
      const scheduleResult = await dedicatedPostingAgent.executeDirectPost({
        group_url: urlList[0],
        content: content.trim(),
        image_filenames: images,
        scheduled_time: scheduledTime
      });
      return res.json(scheduleResult);
    }

    // 4. Đăng ngay lập tức cho 1 nhóm đơn lẻ thông qua Chrome qua Playwright CDP
    const publishResult = await chromePublishService.publishToGroup({
      groupUrl: urlList[0],
      content: content.trim(),
      images
    });

    res.json(publishResult);
  } catch (err) {
    console.error('[API publish error]', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      screenshotUrl: err.screenshotUrl || null
    });
  }
};

// ---------------- MULTI-GROUP QUEUE API ENDPOINTS ---------------- //
app.post('/api/publish/batch', (req, res) => {
  try {
    const { groupUrls, content, images, delayMin, delayMax, autoSpin, scheduledTime } = req.body;
    const result = multiGroupQueueService.createBatch({
      groupUrls,
      content,
      images,
      delayMin,
      delayMax,
      autoSpin,
      scheduledTime
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/publish/queue/active', (req, res) => {
  try {
    const status = multiGroupQueueService.getActiveQueue();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/publish/queue/:batchId', (req, res) => {
  try {
    const details = multiGroupQueueService.getBatchDetails(req.params.batchId);
    if (!details) return res.status(404).json({ success: false, error: 'Không tìm thấy hàng đợi.' });
    res.json({ success: true, ...details });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/publish/queue/:batchId/stop', (req, res) => {
  try {
    const result = multiGroupQueueService.stopBatch(req.params.batchId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trợ lý AI Bất Động Sản (Chatbot Groq API)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'llama-3.3-70b-versatile'];
    let reply = null;

    for (const model of modelsToTry) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là Trợ lý AI Bất Động Sản chuyên nghiệp, nhiệt tình, am hiểu thị trường chung cư, nhà phố, đất nền và dự án tại Việt Nam (đặc biệt khu vực Hà Nội như Khai Sơn City Long Biên). Hãy tư vấn ngắn gọn, giật tít thu hút, soạn thảo bài đăng chuyên nghiệp đầy đủ thông tin căn hộ, diện tích, giá và kêu gọi hành động.'
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1024
        });
        reply = completion.choices[0]?.message?.content?.trim();
        if (reply) break;
      } catch (mErr) {
        console.warn(`[AIChat] Model ${model} failed: ${mErr.message}`);
      }
    }

    if (!reply) {
      reply = 'Chào bạn! Tôi có thể hỗ trợ bạn viết tiêu đề giật tít, bài đăng bán nhà, cho thuê căn hộ hoặc bài đăng BĐS theo yêu cầu.';
    }

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/posting-schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM PostingSchedules WHERE id = ?').run(id);
    res.json({ success: true, message: 'Đã hủy lịch đăng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/posting-schedules/active', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.*, g.group_name 
      FROM PostingSchedules s
      LEFT JOIN TargetGroups g ON s.group_id = g.id
      WHERE s.status = 'Pending'
      ORDER BY datetime(s.scheduled_time) ASC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------- EXTENSION API ENDPOINTS ---------------- //
// 1. Tiện ích Chrome hỏi máy chủ xem có bài nào cần đăng không
app.get('/api/extension/poll-jobs', (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const dueJob = db.prepare(`
      SELECT s.*, g.group_name
      FROM PostingSchedules s
      LEFT JOIN TargetGroups g ON s.group_id = g.id
      WHERE s.status = 'Pending' AND datetime(s.scheduled_time) <= datetime(?)
      ORDER BY datetime(s.scheduled_time) ASC
      LIMIT 1
    `).get(nowIso);

    if (dueJob) {
      // Tạm chuyển sang In_Progress để extension khác không tranh
      db.prepare("UPDATE PostingSchedules SET status = 'In_Progress' WHERE id = ?").run(dueJob.id);
      return res.json({
        success: true,
        hasJob: true,
        job: {
          id: dueJob.id,
          group_url: dueJob.group_id,
          content: dueJob.spun_content,
          cross_post_keyword: /khai/i.test(dueJob.spun_content) ? 'khai' : null
        }
      });
    }

    res.json({ success: true, hasJob: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Tiện ích Chrome báo cáo kết quả đăng bài về máy chủ
app.post('/api/extension/complete-job', (req, res) => {
  try {
    const { jobId, success, error } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE PostingSchedules SET
        status = ?,
        error_log = ?,
        updated_at = ?
      WHERE id = ?
    `).run(success ? 'Published' : 'Failed', error || null, now, jobId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/publish', handlePublishRequest);
app.post('/api/direct-post', handlePublishRequest);

// 9. Photo Gallery
app.get('/api/photos', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos ORDER BY datetime(created_at) DESC').all();
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a photo from database and disk
app.delete('/api/photos/:id', (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (photo) {
      const filePath = path.join(uploadsDir, photo.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
      db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Templates API
app.get('/api/templates', (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY is_builtin DESC, datetime(created_at) DESC').all();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const { name, category, style, title_template, body_template } = req.body;
    if (!name || !title_template || !body_template) {
      return res.status(400).json({ error: 'Tên mẫu, mẫu tiêu đề và mẫu nội dung không được để trống.' });
    }

    const id = 'tpl-' + uuidv4().substr(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO templates (id, name, category, style, title_template, body_template, is_builtin, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, name, category || 'khac', style || 'chuyen_nghiep', title_template, body_template, now, now);

    const created = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const { name, category, style, title_template, body_template } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE templates SET
        name = ?,
        category = ?,
        style = ?,
        title_template = ?,
        body_template = ?,
        updated_at = ?
      WHERE id = ?
    `).run(name, category, style, title_template, body_template, now, req.params.id);

    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const tpl = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!tpl) return res.status(404).json({ error: 'Không tìm thấy mẫu.' });
    if (tpl.is_builtin === 1) {
      return res.status(400).json({ error: 'Không thể xóa mẫu mặc định của hệ thống.' });
    }
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ---------------- PHASE 2: CHANNEL DISCOVERY API ---------------- //

// Helper to format channel row
function formatChannel(row) {
  if (!row) return null;
  const collections = db.prepare(`
    SELECT c.id, c.name, c.color 
    FROM channel_collections c
    JOIN channel_collection_items ci ON c.id = ci.collection_id
    WHERE ci.channel_id = ?
  `).all(row.id);

  return {
    ...row,
    property_types: typeof row.property_types === 'string' ? JSON.parse(row.property_types || '[]') : row.property_types,
    price_segments: typeof row.price_segments === 'string' ? JSON.parse(row.price_segments || '[]') : row.price_segments,
    target_audiences: typeof row.target_audiences === 'string' ? JSON.parse(row.target_audiences || '[]') : row.target_audiences,
    is_favorite: Boolean(row.is_favorite),
    collections: collections || []
  };
}

// Helper to get active score weights
function getScoreWeights() {
  const row = db.prepare("SELECT * FROM score_settings WHERE id = 'default'").get();
  if (row) return row;
  return {
    weight_location: 25,
    weight_property_type: 20,
    weight_price: 15,
    weight_audience: 15,
    weight_freshness: 15,
    weight_capability: 10
  };
}

// 1. Get Score Weights
app.get('/api/channels/score-settings', (req, res) => {
  try {
    const weights = getScoreWeights();
    res.json(weights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/channels/score-settings', (req, res) => {
  try {
    const {
      weight_location = 25,
      weight_property_type = 20,
      weight_price = 15,
      weight_audience = 15,
      weight_freshness = 15,
      weight_capability = 10
    } = req.body;

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO score_settings (id, weight_location, weight_property_type, weight_price, weight_audience, weight_freshness, weight_capability, updated_at)
      VALUES ('default', ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        weight_location = excluded.weight_location,
        weight_property_type = excluded.weight_property_type,
        weight_price = excluded.weight_price,
        weight_audience = excluded.weight_audience,
        weight_freshness = excluded.weight_freshness,
        weight_capability = excluded.weight_capability,
        updated_at = excluded.updated_at
    `).run(
      parseInt(weight_location, 10),
      parseInt(weight_property_type, 10),
      parseInt(weight_price, 10),
      parseInt(weight_audience, 10),
      parseInt(weight_freshness, 10),
      parseInt(weight_capability, 10),
      now
    );

    res.json(getScoreWeights());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Search Provider Status & Search API
app.get('/api/channels/search-provider', (req, res) => {
  try {
    res.json(channelSearchProvider.getStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/channels/search-provider/search', async (req, res) => {
  try {
    const { query = '', filters = {} } = req.body;
    const result = await channelSearchProvider.search(query, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Export Channels to CSV
app.get('/api/channels/export-csv', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM channels ORDER BY name ASC').all().map(formatChannel);
    
    // Header row
    const headers = [
      'name',
      'url',
      'channel_type',
      'category',
      'province',
      'district',
      'property_types',
      'price_segments',
      'target_audiences',
      'verification_status',
      'publishing_capability',
      'member_count',
      'notes'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = headers.join(',') + '\n';

    for (const r of rows) {
      const line = [
        escapeCsv(r.name),
        escapeCsv(r.url),
        escapeCsv(r.channel_type),
        escapeCsv(r.category),
        escapeCsv(r.province),
        escapeCsv(r.district),
        escapeCsv(Array.isArray(r.property_types) ? r.property_types.join(';') : ''),
        escapeCsv(Array.isArray(r.price_segments) ? r.price_segments.join(';') : ''),
        escapeCsv(Array.isArray(r.target_audiences) ? r.target_audiences.join(';') : ''),
        escapeCsv(r.verification_status),
        escapeCsv(r.publishing_capability),
        escapeCsv(r.member_count),
        escapeCsv(r.notes)
      ].join(',');
      csvContent += line + '\n';
    }

    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentBuffer = Buffer.from(csvContent, 'utf-8');
    const finalBuffer = Buffer.concat([bomBuffer, contentBuffer]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="channels_export.csv"');
    res.send(finalBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xuất CSV: ' + error.message });
  }
});

// 4. Import Channels from CSV
app.post('/api/channels/import-csv', (req, res) => {
  try {
    const { csvData, duplicateMode = 'skip' } = req.body;
    if (!csvData || !csvData.trim()) {
      return res.status(400).json({ error: 'Nội dung tệp CSV không được để trống.' });
    }

    // Parse CSV lines
    const parseCsvLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const rawLines = csvData.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim().length > 0);
    if (rawLines.length < 2) {
      return res.status(400).json({ error: 'Tệp CSV cần ít nhất một dòng tiêu đề và một dòng dữ liệu.' });
    }

    const headers = parseCsvLine(rawLines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const nameIdx = headers.indexOf('name');
    const urlIdx = headers.indexOf('url');

    if (nameIdx === -1 || urlIdx === -1) {
      return res.status(400).json({ error: 'Tệp CSV bắt buộc phải chứa cột "name" và "url".' });
    }

    const typeIdx = headers.indexOf('channel_type');
    const provIdx = headers.indexOf('province');
    const distIdx = headers.indexOf('district');
    const propTypesIdx = headers.indexOf('property_types');
    const priceSegIdx = headers.indexOf('price_segments');
    const audIdx = headers.indexOf('target_audiences');
    const verIdx = headers.indexOf('verification_status');
    const capIdx = headers.indexOf('publishing_capability');
    const notesIdx = headers.indexOf('notes');

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO channels (
        id, name, url, channel_type, category, province, district, ward,
        property_types, price_segments, target_audiences, source, verification_status,
        last_verified_at, publishing_capability, is_favorite, member_count, notes,
        created_at, updated_at
      ) VALUES (
        @id, @name, @url, @channel_type, @category, @province, @district, @ward,
        @property_types, @price_segments, @target_audiences, @source, @verification_status,
        @last_verified_at, @publishing_capability, @is_favorite, @member_count, @notes,
        @created_at, @updated_at
      )
    `);

    const updateStmt = db.prepare(`
      UPDATE channels SET
        name = @name,
        channel_type = @channel_type,
        province = @province,
        district = @district,
        property_types = @property_types,
        price_segments = @price_segments,
        target_audiences = @target_audiences,
        verification_status = @verification_status,
        publishing_capability = @publishing_capability,
        notes = @notes,
        updated_at = @updated_at
      WHERE id = @id
    `);

    const checkStmt = db.prepare('SELECT * FROM channels WHERE url = ? OR name = ?');

    const runImport = db.transaction(() => {
      for (let i = 1; i < rawLines.length; i++) {
        const row = parseCsvLine(rawLines[i]);
        const name = row[nameIdx] || '';
        const url = row[urlIdx] || '';

        if (!name || !url) {
          errors.push(`Dòng ${i + 1}: Thiếu tên hoặc URL kênh.`);
          continue;
        }

        // Basic URL validation
        if (!/^https?:\/\//i.test(url)) {
          errors.push(`Dòng ${i + 1}: URL "${url}" không hợp lệ (phải bắt đầu bằng http:// hoặc https://).`);
          continue;
        }

        const channelType = (typeIdx !== -1 && row[typeIdx]) ? row[typeIdx] : 'other';
        const province = (provIdx !== -1 && row[provIdx]) ? row[provIdx] : '';
        const district = (distIdx !== -1 && row[distIdx]) ? row[distIdx] : '';
        const propTypes = (propTypesIdx !== -1 && row[propTypesIdx]) ? row[propTypesIdx].split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
        const priceSegs = (priceSegIdx !== -1 && row[priceSegIdx]) ? row[priceSegIdx].split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
        const audiences = (audIdx !== -1 && row[audIdx]) ? row[audIdx].split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
        const verificationStatus = (verIdx !== -1 && row[verIdx]) ? row[verIdx] : 'unverified';
        
        // Strict publishing capability handling: Facebook groups are manual_only
        let publishingCapability = (capIdx !== -1 && row[capIdx]) ? row[capIdx] : 'unknown';
        if (channelType === 'facebook_group' && publishingCapability === 'api_supported') {
          publishingCapability = 'manual_only';
        }

        const notes = (notesIdx !== -1 && row[notesIdx]) ? row[notesIdx] : '';

        const existing = checkStmt.get(url, name);
        if (existing) {
          if (duplicateMode === 'skip') {
            skipped++;
            continue;
          } else if (duplicateMode === 'update') {
            updateStmt.run({
              id: existing.id,
              name,
              channel_type: channelType,
              province,
              district,
              property_types: JSON.stringify(propTypes),
              price_segments: JSON.stringify(priceSegs),
              target_audiences: JSON.stringify(audiences),
              verification_status: verificationStatus,
              publishing_capability: publishingCapability,
              notes,
              updated_at: now
            });
            updated++;
            continue;
          }
        }

        const id = 'chan-' + uuidv4().substr(0, 10);
        insertStmt.run({
          id,
          name,
          url,
          channel_type: channelType,
          category: 'bat_dong_san',
          province,
          district,
          ward: '',
          property_types: JSON.stringify(propTypes),
          price_segments: JSON.stringify(priceSegs),
          target_audiences: JSON.stringify(audiences),
          source: 'csv',
          verification_status: verificationStatus,
          last_verified_at: verificationStatus === 'verified' ? now : null,
          publishing_capability: publishingCapability,
          is_favorite: 0,
          member_count: 0,
          notes,
          created_at: now,
          updated_at: now
        });
        imported++;
      }
    });

    runImport();

    res.json({
      success: true,
      totalRows: rawLines.length - 1,
      imported,
      updated,
      skipped,
      errors
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Lỗi nhập CSV: ' + error.message });
  }
});

// 5. Get Channels with Search, Criteria Matching, Sorting, Pagination
app.get('/api/channels', (req, res) => {
  try {
    const {
      search = '',
      channel_type = '',
      verification_status = '',
      publishing_capability = '',
      province = '',
      district = '',
      is_favorite = '',
      collection_id = '',
      match_province = '',
      match_district = '',
      match_property_type = '',
      match_price_segment = '',
      match_audience = '',
      min_score = '',
      sort_by = 'score_desc',
      page = 1,
      limit = 12
    } = req.query;

    const weights = getScoreWeights();

    const criteria = {
      province: match_province || province,
      district: match_district || district,
      property_type: match_property_type,
      price_segment: match_price_segment,
      target_audience: match_audience
    };

    let query = `
      SELECT c.* 
      FROM channels c
    `;
    const params = [];
    const conditions = [];

    if (collection_id && collection_id !== 'all') {
      query += ` JOIN channel_collection_items ci ON c.id = ci.channel_id AND ci.collection_id = ? `;
      params.push(collection_id);
    }

    if (search.trim()) {
      conditions.push('(c.name LIKE ? OR c.url LIKE ? OR c.district LIKE ? OR c.province LIKE ? OR c.notes LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (channel_type && channel_type !== 'all') {
      conditions.push('c.channel_type = ?');
      params.push(channel_type);
    }

    if (verification_status && verification_status !== 'all') {
      conditions.push('c.verification_status = ?');
      params.push(verification_status);
    }

    if (publishing_capability && publishing_capability !== 'all') {
      conditions.push('c.publishing_capability = ?');
      params.push(publishing_capability);
    }

    if (province && province !== 'all') {
      conditions.push('c.province LIKE ?');
      params.push(`%${province}%`);
    }

    if (district && district !== 'all') {
      conditions.push('c.district LIKE ?');
      params.push(`%${district}%`);
    }

    if (is_favorite === '1' || is_favorite === 'true') {
      conditions.push('c.is_favorite = 1');
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')} `;
    }

    // Fetch all matching candidates to compute explainable relevance scores
    const rows = db.prepare(query).all(...params);

    let processed = rows.map((r) => {
      const formatted = formatChannel(r);
      const scoreObj = calculateRelevance(formatted, criteria, weights);
      return {
        ...formatted,
        relevanceScore: scoreObj.totalScore,
        scoreBreakdown: scoreObj.breakdown,
        scoreWeights: scoreObj.weights
      };
    });

    // Filter by min score if specified
    if (min_score && !isNaN(min_score)) {
      const minScoreVal = parseInt(min_score, 10);
      processed = processed.filter(c => c.relevanceScore >= minScoreVal);
    }

    // Sorting
    processed.sort((a, b) => {
      if (sort_by === 'score_desc') return b.relevanceScore - a.relevanceScore;
      if (sort_by === 'score_asc') return a.relevanceScore - b.relevanceScore;
      if (sort_by === 'name_asc') return a.name.localeCompare(b.name, 'vi');
      if (sort_by === 'name_desc') return b.name.localeCompare(a.name, 'vi');
      if (sort_by === 'members_desc') return (b.member_count || 0) - (a.member_count || 0);
      if (sort_by === 'verified_desc') {
        const da = a.last_verified_at ? new Date(a.last_verified_at).getTime() : 0;
        const db = b.last_verified_at ? new Date(b.last_verified_at).getTime() : 0;
        return db - da;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    const total = processed.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;
    const items = processed.slice(offset, offset + limitNum);

    res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      criteria,
      weights
    });
  } catch (error) {
    console.error('Channels get error:', error);
    res.status(500).json({ error: 'Lỗi tải danh sách kênh: ' + error.message });
  }
});

// 6. Get Single Channel Details with Score Breakdown
app.get('/api/channels/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM channels WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy kênh này.' });
    }

    const formatted = formatChannel(row);
    const weights = getScoreWeights();
    const criteria = {
      province: req.query.match_province || '',
      district: req.query.match_district || '',
      property_type: req.query.match_property_type || '',
      price_segment: req.query.match_price_segment || '',
      target_audience: req.query.match_audience || ''
    };

    const scoreObj = calculateRelevance(formatted, criteria, weights);

    res.json({
      ...formatted,
      relevanceScore: scoreObj.totalScore,
      scoreBreakdown: scoreObj.breakdown,
      scoreWeights: scoreObj.weights,
      criteria
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Create Custom Channel
app.post('/api/channels', (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Tên kênh không được để trống.' });
    }
    if (!data.url || !data.url.trim()) {
      return res.status(400).json({ error: 'URL kênh không được để trống.' });
    }

    const cleanUrl = data.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return res.status(400).json({ error: 'URL kênh phải hợp lệ (bắt đầu bằng http:// hoặc https://).' });
    }

    // Duplicate check
    const existing = db.prepare('SELECT id, name FROM channels WHERE url = ?').get(cleanUrl);
    if (existing) {
      return res.status(409).json({ error: `Kênh với URL này đã tồn tại trong hệ thống (Tên: "${existing.name}").` });
    }

    const id = data.id || 'chan-' + uuidv4().substr(0, 10);
    const now = new Date().toISOString();

    // Strict rule: Facebook groups must not claim automatic api publishing unless verified
    let pubCapability = data.publishing_capability || 'unknown';
    if (data.channel_type === 'facebook_group' && pubCapability === 'api_supported') {
      pubCapability = 'manual_only';
    }

    const insertStmt = db.prepare(`
      INSERT INTO channels (
        id, name, url, channel_type, category, province, district, ward,
        property_types, price_segments, target_audiences, source, verification_status,
        last_verified_at, publishing_capability, is_favorite, member_count, notes,
        created_at, updated_at
      ) VALUES (
        @id, @name, @url, @channel_type, @category, @province, @district, @ward,
        @property_types, @price_segments, @target_audiences, @source, @verification_status,
        @last_verified_at, @publishing_capability, @is_favorite, @member_count, @notes,
        @created_at, @updated_at
      )
    `);

    insertStmt.run({
      id,
      name: data.name.trim(),
      url: cleanUrl,
      channel_type: data.channel_type || 'facebook_group',
      category: data.category || 'bat_dong_san',
      province: data.province || '',
      district: data.district || '',
      ward: data.ward || '',
      property_types: JSON.stringify(Array.isArray(data.property_types) ? data.property_types : []),
      price_segments: JSON.stringify(Array.isArray(data.price_segments) ? data.price_segments : []),
      target_audiences: JSON.stringify(Array.isArray(data.target_audiences) ? data.target_audiences : []),
      source: data.source || 'manual',
      verification_status: data.verification_status || 'unverified',
      last_verified_at: data.verification_status === 'verified' ? (data.last_verified_at || now) : null,
      publishing_capability: pubCapability,
      is_favorite: data.is_favorite ? 1 : 0,
      member_count: data.member_count ? parseInt(data.member_count, 10) : 0,
      notes: data.notes || '',
      created_at: now,
      updated_at: now
    });

    // Link to collection if requested
    if (data.collection_id) {
      db.prepare(`
        INSERT OR IGNORE INTO channel_collection_items (collection_id, channel_id, added_at)
        VALUES (?, ?, ?)
      `).run(data.collection_id, id, now);
    }

    const created = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
    res.status(201).json(formatChannel(created));
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Lỗi tạo kênh: ' + error.message });
  }
});

// 8. Update Channel
app.put('/api/channels/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy kênh cần cập nhật.' });
    }

    const data = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ error: 'Tên kênh không được để trống.' });
    }
    if (!data.url || !data.url.trim()) {
      return res.status(400).json({ error: 'URL kênh không được để trống.' });
    }

    const cleanUrl = data.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      return res.status(400).json({ error: 'URL kênh phải hợp lệ (bắt đầu bằng http:// hoặc https://).' });
    }

    // Check duplicate URL with other channels
    const dup = db.prepare('SELECT id FROM channels WHERE url = ? AND id != ?').get(cleanUrl, id);
    if (dup) {
      return res.status(409).json({ error: 'URL kênh đã bị trùng với một kênh khác trong hệ thống.' });
    }

    const now = new Date().toISOString();
    let pubCapability = data.publishing_capability !== undefined ? data.publishing_capability : existing.publishing_capability;
    const channelType = data.channel_type || existing.channel_type;
    if (channelType === 'facebook_group' && pubCapability === 'api_supported') {
      pubCapability = 'manual_only';
    }

    const updateStmt = db.prepare(`
      UPDATE channels SET
        name = @name,
        url = @url,
        channel_type = @channel_type,
        category = @category,
        province = @province,
        district = @district,
        ward = @ward,
        property_types = @property_types,
        price_segments = @price_segments,
        target_audiences = @target_audiences,
        verification_status = @verification_status,
        last_verified_at = @last_verified_at,
        publishing_capability = @publishing_capability,
        is_favorite = @is_favorite,
        member_count = @member_count,
        notes = @notes,
        updated_at = @updated_at
      WHERE id = @id
    `);

    updateStmt.run({
      id,
      name: data.name.trim(),
      url: cleanUrl,
      channel_type: channelType,
      category: data.category !== undefined ? data.category : existing.category,
      province: data.province !== undefined ? data.province : existing.province,
      district: data.district !== undefined ? data.district : existing.district,
      ward: data.ward !== undefined ? data.ward : existing.ward,
      property_types: JSON.stringify(Array.isArray(data.property_types) ? data.property_types : JSON.parse(existing.property_types || '[]')),
      price_segments: JSON.stringify(Array.isArray(data.price_segments) ? data.price_segments : JSON.parse(existing.price_segments || '[]')),
      target_audiences: JSON.stringify(Array.isArray(data.target_audiences) ? data.target_audiences : JSON.parse(existing.target_audiences || '[]')),
      verification_status: data.verification_status !== undefined ? data.verification_status : existing.verification_status,
      last_verified_at: data.last_verified_at !== undefined ? data.last_verified_at : (data.verification_status === 'verified' && !existing.last_verified_at ? now : existing.last_verified_at),
      publishing_capability: pubCapability,
      is_favorite: data.is_favorite !== undefined ? (data.is_favorite ? 1 : 0) : existing.is_favorite,
      member_count: data.member_count !== undefined ? parseInt(data.member_count, 10) : existing.member_count,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updated_at: now
    });

    const updated = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
    res.json(formatChannel(updated));
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật kênh: ' + error.message });
  }
});

// 9. Delete Channel
app.delete('/api/channels/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT id FROM channels WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy kênh cần xóa.' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM channel_collection_items WHERE channel_id = ?').run(id);
      db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    })();

    res.json({ success: true, message: 'Đã xóa kênh thành công.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Toggle Favorite
app.post('/api/channels/:id/toggle-favorite', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT is_favorite FROM channels WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy kênh.' });

    const newFav = existing.is_favorite ? 0 : 1;
    db.prepare('UPDATE channels SET is_favorite = ?, updated_at = ? WHERE id = ?').run(newFav, new Date().toISOString(), id);
    res.json({ success: true, id, is_favorite: Boolean(newFav) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Quick Verify Channel
app.post('/api/channels/:id/verify', (req, res) => {
  try {
    const id = req.params.id;
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT verification_status FROM channels WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy kênh.' });

    const newStatus = existing.verification_status === 'verified' ? 'unverified' : 'verified';
    const lastVerified = newStatus === 'verified' ? now : null;

    db.prepare(`
      UPDATE channels 
      SET verification_status = ?, last_verified_at = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, lastVerified, now, id);

    res.json({ success: true, id, verification_status: newStatus, last_verified_at: lastVerified });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Bulk Delete Channels
app.post('/api/channels/bulk-delete', (req, res) => {
  try {
    const { channelIds = [] } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách kênh xóa không được để trống.' });
    }

    db.transaction(() => {
      const delItemStmt = db.prepare('DELETE FROM channel_collection_items WHERE channel_id = ?');
      const delChanStmt = db.prepare('DELETE FROM channels WHERE id = ?');
      for (const cid of channelIds) {
        delItemStmt.run(cid);
        delChanStmt.run(cid);
      }
    })();

    res.json({ success: true, deletedCount: channelIds.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Bulk Verify Channels
app.post('/api/channels/bulk-verify', (req, res) => {
  try {
    const { channelIds = [] } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách kênh xác minh không được để trống.' });
    }

    const now = new Date().toISOString();
    db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE channels 
        SET verification_status = 'verified', last_verified_at = ?, updated_at = ?
        WHERE id = ?
      `);
      for (const cid of channelIds) {
        stmt.run(now, now, cid);
      }
    })();

    res.json({ success: true, verifiedCount: channelIds.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Bulk Collection Operations
app.post('/api/channels/bulk-collection', (req, res) => {
  try {
    const { channelIds = [], collectionId, action = 'add' } = req.body;
    if (!collectionId) return res.status(400).json({ error: 'Vui lòng chọn bộ sưu tập.' });
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'Danh sách kênh không được để trống.' });
    }

    const now = new Date().toISOString();
    db.transaction(() => {
      if (action === 'add') {
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO channel_collection_items (collection_id, channel_id, added_at)
          VALUES (?, ?, ?)
        `);
        for (const cid of channelIds) stmt.run(collectionId, cid, now);
      } else {
        const stmt = db.prepare(`
          DELETE FROM channel_collection_items 
          WHERE collection_id = ? AND channel_id = ?
        `);
        for (const cid of channelIds) stmt.run(collectionId, cid);
      }
    })();

    res.json({ success: true, count: channelIds.length, action, collectionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Channel Collections API (CRUD)
app.get('/api/collections', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, COUNT(ci.channel_id) as channel_count
      FROM channel_collections c
      LEFT JOIN channel_collection_items ci ON c.id = ci.collection_id
      GROUP BY c.id
      ORDER BY datetime(c.created_at) DESC
    `).all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collections', (req, res) => {
  try {
    const { name, description = '', color = 'emerald' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên bộ sưu tập không được để trống.' });
    }

    const id = 'col-' + uuidv4().substr(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO channel_collections (id, name, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), description, color, now, now);

    const created = db.prepare('SELECT * FROM channel_collections WHERE id = ?').get(id);
    res.status(201).json({ ...created, channel_count: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/collections/:id', (req, res) => {
  try {
    const { name, description = '', color = 'emerald' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên bộ sưu tập không được để trống.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE channel_collections 
      SET name = ?, description = ?, color = ?, updated_at = ?
      WHERE id = ?
    `).run(name.trim(), description, color, now, req.params.id);

    const updated = db.prepare(`
      SELECT c.*, COUNT(ci.channel_id) as channel_count
      FROM channel_collections c
      LEFT JOIN channel_collection_items ci ON c.id = ci.collection_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/collections/:id', (req, res) => {
  try {
    db.transaction(() => {
      db.prepare('DELETE FROM channel_collection_items WHERE collection_id = ?').run(req.params.id);
      db.prepare('DELETE FROM channel_collections WHERE id = ?').run(req.params.id);
    })();
    res.json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- PHASE 3: PUBLISHING AUTOMATION API ---------------- //

function formatTask(row) {
  if (!row) return null;
  const parsedMedia = typeof row.media_urls === 'string' ? JSON.parse(row.media_urls || '[]') : (row.media_urls || []);
  const parsedContact = typeof row.contact_info === 'string' ? JSON.parse(row.contact_info || '{}') : (row.contact_info || {});
  const parsedApprovedPhotos = typeof row.approved_photo_ids === 'string' ? JSON.parse(row.approved_photo_ids || '[]') : (row.approved_photo_ids || []);
  return {
    ...row,
    outcome: row.outcome_type,
    retry_count: row.attempt_count,
    worker_state: row.worker_state || (row.status === 'published' ? 'PUBLISHED' : (row.status === 'failed' ? 'FAILED' : 'PENDING')),
    location_verification_status: row.location_verification_status || 'UNVERIFIED',
    approved_photo_ids: parsedApprovedPhotos,
    custom_payload: {
      title: row.title,
      description: row.content,
      contact_info: typeof row.contact_info === 'string' ? row.contact_info : (parsedContact.phone || parsedContact.name || ''),
      cta: row.cta_link || '',
      hashtags: row.hashtags || '',
      photos: parsedMedia.map(item => (typeof item === 'string' ? { url: item } : item))
    },
    media_urls: parsedMedia,
    contact_info: parsedContact
  };
}

// 1. Publishing Dashboard Statistics
app.get('/api/publishing/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM publishing_tasks').get().count;
    const published = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'published'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'failed'").get().count;
    const scheduled = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'scheduled'").get().count;
    const needsManual = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'needs_manual_action'").get().count;
    const queued = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'queued' OR status = 'publishing'").get().count;
    const unknown = db.prepare("SELECT COUNT(*) as count FROM publishing_tasks WHERE status = 'outcome_unknown' OR (outcome_type = 'unknown' AND status != 'needs_manual_action')").get().count;

    res.json({
      total,
      published,
      failed,
      scheduled,
      needsManual,
      needs_manual: needsManual,
      queued,
      unknown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Publishing Tasks with Filters & Pagination
app.get('/api/publishing/tasks', (req, res) => {
  try {
    const {
      listing_id = '',
      channel_id = '',
      status = '',
      outcome_type = '',
      search = '',
      sort_by = 'created_desc',
      page = 1,
      limit = 12
    } = req.query;

    const conditions = [];
    const params = [];

    if (listing_id && listing_id !== 'all') {
      conditions.push('t.listing_id = ?');
      params.push(listing_id);
    }

    if (channel_id && channel_id !== 'all') {
      conditions.push('t.channel_id = ?');
      params.push(channel_id);
    }

    if (status && status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (outcome_type && outcome_type !== 'all') {
      conditions.push('t.outcome_type = ?');
      params.push(outcome_type);
    }

    if (search.trim()) {
      conditions.push('(t.title LIKE ? OR t.content LIKE ? OR c.name LIKE ? OR l.title LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY datetime(t.created_at) DESC';
    if (sort_by === 'scheduled_asc') orderClause = 'ORDER BY datetime(t.scheduled_at) ASC';
    if (sort_by === 'scheduled_desc') orderClause = 'ORDER BY datetime(t.scheduled_at) DESC';
    if (sort_by === 'status_asc') orderClause = 'ORDER BY t.status ASC';

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      LEFT JOIN listings l ON t.listing_id = l.id
      ${whereClause}
    `;
    const total = db.prepare(countQuery).get(...params).total;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT 
        t.*,
        c.name as channel_name,
        c.url as channel_url,
        c.channel_type,
        c.publishing_capability,
        l.title as listing_title,
        l.price as listing_price,
        l.price_unit as listing_price_unit
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      LEFT JOIN listings l ON t.listing_id = l.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(query).all(...params, limitNum, offset);
    const items = rows.map(formatTask);

    res.json({
      items,
      tasks: items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Single Task Details
app.get('/api/publishing/tasks/:id', (req, res) => {
  try {
    const query = `
      SELECT 
        t.*,
        c.name as channel_name,
        c.url as channel_url,
        c.channel_type,
        c.publishing_capability,
        l.title as listing_title,
        l.photos as listing_photos,
        l.address_detail,
        l.district,
        l.province
      FROM publishing_tasks t
      LEFT JOIN channels c ON t.channel_id = c.id
      LEFT JOIN listings l ON t.listing_id = l.id
      WHERE t.id = ?
    `;
    const row = db.prepare(query).get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ xuất bản.' });
    }
    res.json(formatTask(row));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create Publishing Tasks (Batch / Multi-channel workflow)
app.post('/api/publishing/tasks', (req, res) => {
  try {
    const {
      listing_id,
      channel_ids = [],
      channel_contents = {},
      customizations = {},
      action = 'draft', // 'draft' | 'awaiting_approval' | 'publish_now' | 'schedule'
      scheduled_at = null,
      scheduled_for = null
    } = req.body;

    const targetScheduled = scheduled_at || scheduled_for || null;

    if (!listing_id) {
      return res.status(400).json({ error: 'Vui lòng chọn tin bất động sản cần đăng.' });
    }

    if (!Array.isArray(channel_ids) || channel_ids.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một kênh tiếp thị đích.' });
    }

    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listing_id);
    if (!listing) {
      return res.status(404).json({ error: 'Không tìm thấy tin bất động sản tương ứng.' });
    }

    const now = new Date().toISOString();
    const createdTasks = [];

    let initialStatus = 'draft';
    if (action === 'publish_now') initialStatus = 'queued';
    else if (action === 'schedule') initialStatus = 'scheduled';
    else if (action === 'awaiting_approval') initialStatus = 'awaiting_approval';

    const insertStmt = db.prepare(`
      INSERT INTO publishing_tasks (
        id, listing_id, channel_id, status, title, content, media_urls,
        contact_info, cta_type, cta_link, hashtags, scheduled_at, started_at,
        completed_at, attempt_count, max_attempts, platform_post_id, published_url,
        error_code, error_message, outcome_type, idempotency_key,
        approved_photo_ids, location_verification_status, worker_state,
        created_at, updated_at
      ) VALUES (
        @id, @listing_id, @channel_id, @status, @title, @content, @media_urls,
        @contact_info, @cta_type, @cta_link, @hashtags, @scheduled_at, @started_at,
        @completed_at, @attempt_count, @max_attempts, @platform_post_id, @published_url,
        @error_code, @error_message, @outcome_type, @idempotency_key,
        @approved_photo_ids, @location_verification_status, @worker_state,
        @created_at, @updated_at
      )
    `);

    db.transaction(() => {
      for (const channelId of channel_ids) {
        const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(channelId);
        if (!channel) continue;

        const customContent = customizations[channelId] || channel_contents[channelId] || {};
        const title = customContent.title || listing.title || '';
        const content = customContent.description || customContent.content || listing.description || '';
        const mediaUrls = customContent.photos ? (Array.isArray(customContent.photos) ? customContent.photos.map(p => p.url) : []) : (customContent.media_urls || (listing.photos ? JSON.parse(listing.photos || '[]').map(p => p.url) : []));
        const contactInfo = customContent.contact_info || {
          name: listing.contact_name,
          phone: listing.contact_phone,
          zalo: listing.contact_zalo
        };
        const ctaType = customContent.cta_type || 'call_now';
        const ctaLink = customContent.cta || customContent.cta_link || (listing.contact_phone ? `tel:${listing.contact_phone}` : '');
        const hashtags = customContent.hashtags || '#Batdongsan #RealEstate';

        // Unique idempotency key to prevent accidental duplicate submission
        const idempRaw = `${listing_id}:${channelId}:${action}:${action === 'schedule' ? targetScheduled : Math.floor(Date.now() / 15000)}`;
        const idempotencyKey = crypto.createHash('md5').update(idempRaw).digest('hex');

        // Check if exact same task was already submitted within last 15s
        const existingTask = db.prepare('SELECT id FROM publishing_tasks WHERE idempotency_key = ?').get(idempotencyKey);
        if (existingTask) {
          continue; // Duplicate prevented
        }

        const taskId = 'pub-' + uuidv4().substr(0, 10);
        
        // If channel capability is strictly manual_only and user chose publish_now, mark directly as needs_manual_action
        let taskStatus = initialStatus;
        let errorMessage = null;
        if (action === 'publish_now' && (channel.publishing_capability === 'manual_only' || channel.channel_type === 'facebook_group')) {
          taskStatus = 'needs_manual_action';
          errorMessage = 'Kênh này yêu cầu xuất bản thủ công có hướng dẫn theo chính sách nền tảng.';
        }

        const initialWorkerState = action === 'schedule' ? 'SCHEDULED' : (action === 'publish_now' ? 'PENDING' : 'PENDING');

        const taskRecord = {
          id: taskId,
          listing_id,
          channel_id: channelId,
          status: taskStatus,
          title,
          content,
          media_urls: JSON.stringify(mediaUrls),
          contact_info: JSON.stringify(contactInfo),
          cta_type: ctaType,
          cta_link: ctaLink,
          hashtags,
          scheduled_at: action === 'schedule' ? targetScheduled : null,
          started_at: null,
          completed_at: null,
          attempt_count: 0,
          max_attempts: 3,
          platform_post_id: null,
          published_url: null,
          error_code: null,
          error_message: errorMessage,
          outcome_type: 'unknown',
          idempotency_key: idempotencyKey,
          approved_photo_ids: listing.approved_photo_ids || '[]',
          location_verification_status: listing.location_verification_status || 'UNVERIFIED',
          worker_state: initialWorkerState,
          created_at: now,
          updated_at: now
        };

        insertStmt.run(taskRecord);
        createdTasks.push({
          ...taskRecord,
          channel_type: channel.channel_type,
          channel_name: channel.name
        });
      }
    })();

    if (createdTasks.length === 0 && channel_ids.length > 0) {
      return res.status(409).json({
        error: 'Yêu cầu đăng tin trùng lặp đang được xử lý trong hàng đợi. Vui lòng không bấm liên tiếp.',
        is_duplicate: true
      });
    }

    // Trigger queue processing asynchronously
    if (action === 'publish_now') {
      setTimeout(() => scheduler.processQueue(), 500);
    }

    res.status(201).json({
      success: true,
      message: `Đã tạo ${createdTasks.length} nhiệm vụ xuất bản thành công!`,
      tasks: createdTasks.map(formatTask)
    });
  } catch (error) {
    console.error('Create publishing task error:', error);
    res.status(500).json({ error: 'Lỗi tạo nhiệm vụ xuất bản: ' + error.message });
  }
});

// 5. Update Task
app.put('/api/publishing/tasks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ xuất bản.' });
    }

    if (existing.status === 'publishing') {
      return res.status(400).json({ error: 'Nhiệm vụ đang trong tiến trình xuất bản, không thể chỉnh sửa.' });
    }

    const data = req.body;
    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE publishing_tasks SET
        title = @title,
        content = @content,
        media_urls = @media_urls,
        hashtags = @hashtags,
        cta_type = @cta_type,
        cta_link = @cta_link,
        scheduled_at = @scheduled_at,
        status = @status,
        updated_at = @updated_at
      WHERE id = @id
    `);

    updateStmt.run({
      id,
      title: data.title !== undefined ? data.title : existing.title,
      content: data.content !== undefined ? data.content : existing.content,
      media_urls: JSON.stringify(Array.isArray(data.media_urls) ? data.media_urls : JSON.parse(existing.media_urls || '[]')),
      hashtags: data.hashtags !== undefined ? data.hashtags : existing.hashtags,
      cta_type: data.cta_type !== undefined ? data.cta_type : existing.cta_type,
      cta_link: data.cta_link !== undefined ? data.cta_link : existing.cta_link,
      scheduled_at: data.scheduled_at !== undefined ? data.scheduled_at : existing.scheduled_at,
      status: data.status || existing.status,
      updated_at: now
    });

    const updated = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    res.json(formatTask(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Delete Task
app.delete('/api/publishing/tasks/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT id, status FROM publishing_tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ.' });
    }
    if (existing.status === 'publishing') {
      return res.status(400).json({ error: 'Nhiệm vụ đang xuất bản, không thể xóa ngay lúc này.' });
    }

    db.prepare('DELETE FROM publishing_tasks WHERE id = ?').run(id);
    res.json({ success: true, message: 'Đã xóa nhiệm vụ xuất bản thành công.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Cancel Task (for scheduled/queued)
app.post('/api/publishing/tasks/:id/cancel', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ.' });

    if (existing.status === 'published') {
      return res.status(400).json({ error: 'Bài viết đã xuất bản thành công, không thể hủy lịch.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE publishing_tasks 
      SET status = 'cancelled', updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const updated = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    res.json({
      success: true,
      message: 'Đã hủy nhiệm vụ xuất bản.',
      id,
      status: 'cancelled',
      task: formatTask(updated)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Retry Task (Safe bounded retry for failed/unknown)
app.post('/api/publishing/tasks/:id/retry', (req, res) => {
  try {
    const id = req.params.id;
    const task = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ.' });

    const now = new Date().toISOString();

    // Check channel capability to route properly
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(task.channel_id);
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
    `).run(newStatus, now, id);

    if (newStatus === 'queued') {
      setTimeout(() => scheduler.processQueue(), 500);
    }

    const updated = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    res.json({
      success: true,
      message: 'Đã đưa nhiệm vụ vào hàng đợi thử lại.',
      id,
      status: newStatus,
      task: formatTask(updated)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Confirm Manual Publication (User-Confirmed Workflow)
app.post('/api/publishing/tasks/:id/confirm-manual', (req, res) => {
  try {
    const id = req.params.id;
    const task = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    if (!task) return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ.' });

    const { published_url = '' } = req.body || {};
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE publishing_tasks SET
        status = 'published',
        outcome_type = 'user_confirmed_manual',
        published_url = ?,
        error_code = NULL,
        error_message = NULL,
        completed_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(published_url.trim() || null, now, now, id);

    const updated = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(id);
    res.json({
      success: true,
      message: 'Đã xác nhận xuất bản thủ công thành công!',
      id,
      status: 'published',
      outcome_type: 'user_confirmed_manual',
      task: formatTask(updated)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9b. Worker Status & Queue Dashboard API
app.get('/api/publishing/worker-status', (req, res) => {
  try {
    const queueCounts = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'queued' OR worker_state = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'publishing' OR worker_state IN ('RUNNING', 'CONNECTING', 'PUBLISHING') THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'scheduled' OR worker_state = 'SCHEDULED' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN status = 'published' OR worker_state = 'PUBLISHED' THEN 1 END) as published_count,
        COUNT(CASE WHEN status = 'failed' OR worker_state = 'FAILED' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'needs_manual_action' OR worker_state = 'NEEDS_MANUAL_ACTION' THEN 1 END) as manual_action_count
      FROM publishing_tasks
    `).get();

    const recentLogs = db.prepare(`
      SELECT * FROM publishing_execution_logs 
      ORDER BY datetime(created_at) DESC 
      LIMIT 10
    `).all();

    res.json({
      success: true,
      worker: {
        engine_status: 'RUNNING',
        worker_id: 'Worker-Node-01',
        heartbeat: new Date().toISOString(),
        poll_interval_ms: 5000,
        queue_stats: queueCounts,
        recent_logs: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9c. Detailed Publishing Execution Logs API
app.get('/api/publishing/execution-logs', (req, res) => {
  try {
    const { job_id, limit = 50, status } = req.query;
    let query = 'SELECT * FROM publishing_execution_logs';
    const params = [];
    const conditions = [];

    if (job_id) {
      conditions.push('job_id = ?');
      params.push(job_id);
    }
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY datetime(created_at) DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 50);

    const logs = db.prepare(query).all(...params);
    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Connector Credentials Management API
app.get('/api/connectors', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM connector_credentials ORDER BY connector_type ASC').all();
    
    // Protect tokens at rest: redact access_token in responses!
    const sanitized = rows.map(r => ({
      ...r,
      id: r.connector_type, // Normalize standard id matching connector_type
      db_id: r.id,
      name: r.account_name,
      config: {
        app_id: r.app_id || '',
        access_token: r.access_token ? `***CONFIGURED (${r.access_token.slice(-4)})***` : '',
        page_id: r.page_id || '',
        api_endpoint: r.api_endpoint || '',
        location_id: r.page_id || '',
        broker_id: r.app_id || ''
      },
      is_configured: Boolean(r.access_token),
      access_token: r.access_token ? `***CONFIGURED (${r.access_token.slice(-4)})***` : '',
      has_token: Boolean(r.access_token)
    }));

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/connectors/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM connector_credentials WHERE id = ? OR connector_type = ?').get(id, id);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy connector.' });

    const bodyConfig = req.body.config || {};
    const account_name = req.body.account_name || req.body.name || existing.account_name;
    const app_id = bodyConfig.app_id || bodyConfig.broker_id || req.body.app_id || existing.app_id;
    const access_token = bodyConfig.access_token !== undefined ? bodyConfig.access_token : (bodyConfig.api_key !== undefined ? bodyConfig.api_key : req.body.access_token);
    const page_id = bodyConfig.page_id || bodyConfig.location_id || req.body.page_id || existing.page_id;
    const api_endpoint = bodyConfig.api_endpoint || req.body.api_endpoint || existing.api_endpoint;
    const is_active = req.body.is_active !== undefined ? (req.body.is_active ? 1 : 0) : existing.is_active;
    const now = new Date().toISOString();

    // Only update token if a new non-redacted token was sent
    const newAccessToken = access_token && !access_token.startsWith('***CONFIGURED') 
      ? access_token.trim() 
      : existing.access_token;

    const newStatus = newAccessToken ? 'connected' : 'not_configured';

    db.prepare(`
      UPDATE connector_credentials SET
        account_name = @account_name,
        app_id = @app_id,
        access_token = @access_token,
        page_id = @page_id,
        api_endpoint = @api_endpoint,
        is_active = @is_active,
        status = @status,
        last_validated_at = @last_validated_at,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: existing.id,
      account_name,
      app_id,
      access_token: newAccessToken,
      page_id,
      api_endpoint,
      is_active,
      status: newStatus,
      last_validated_at: newAccessToken ? now : null,
      updated_at: now
    });

    const updated = db.prepare('SELECT * FROM connector_credentials WHERE id = ?').get(existing.id);
    res.json({
      ...updated,
      id: updated.connector_type,
      name: updated.account_name,
      config: {
        app_id: updated.app_id || '',
        access_token: updated.access_token ? `***CONFIGURED (${updated.access_token.slice(-4)})***` : '',
        page_id: updated.page_id || '',
        api_endpoint: updated.api_endpoint || '',
        location_id: updated.page_id || '',
        broker_id: updated.app_id || ''
      },
      is_configured: Boolean(updated.access_token),
      access_token: updated.access_token ? `***CONFIGURED (${updated.access_token.slice(-4)})***` : '',
      has_token: Boolean(updated.access_token)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/connectors/:id/test', async (req, res) => {
  try {
    const id = req.params.id;
    const cred = db.prepare('SELECT * FROM connector_credentials WHERE id = ? OR connector_type = ?').get(id, id);
    if (!cred) return res.status(404).json({ error: 'Không tìm thấy connector.' });

    let validationResult = { isValid: false, message: 'Chưa xác thực' };

    if (cred.connector_type === 'facebook_page') {
      const connector = new (require('./connectors/FacebookPageConnector'))(cred);
      validationResult = await connector.validateConfig();
    } else if (cred.connector_type === 'batdongsan_portal') {
      const connector = new (require('./connectors/PortalConnector'))(cred);
      validationResult = await connector.validateConfig();
    } else if (cred.connector_type === 'google_business') {
      const connector = new (require('./connectors/GoogleBusinessConnector'))(cred);
      validationResult = await connector.validateConfig();
    }

    res.json({
      success: validationResult.isValid,
      ...validationResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- GIAI ĐOẠN 1: 4 BẢNG CỐT LÕI & PLAYWRIGHT MEDIA APIS ---------------- //
// Absolute media path helper for Playwright & automation workers
app.get('/api/media/absolute-path', (req, res) => {
  try {
    const file = req.query.file || req.query.path || req.query.url;
    if (!file) {
      return res.status(400).json({ success: false, error: 'Thiếu tham số file/path.' });
    }
    const absPath = getAbsoluteMediaPath(file);
    const exists = fs.existsSync(absPath) && fs.statSync(absPath).isFile();
    res.json({
      success: true,
      file_identifier: file,
      absolute_path: absPath,
      exists,
      file_size: exists ? fs.statSync(absPath).size : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Properties Core API
app.get('/api/core/properties', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM Properties ORDER BY updated_at DESC').all();
    const data = rows.map(r => ({
      ...r,
      extracted_tags: typeof r.extracted_tags === 'string' ? JSON.parse(r.extracted_tags || '[]') : r.extracted_tags
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/core/properties/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM Properties WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Không tìm thấy bất động sản' });
    row.extracted_tags = typeof row.extracted_tags === 'string' ? JSON.parse(row.extracted_tags || '[]') : row.extracted_tags;
    const media = db.prepare('SELECT * FROM MediaAssets WHERE property_id = ? ORDER BY sort_order ASC').all();
    res.json({ success: true, data: { ...row, media } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. MediaAssets Core API
app.get('/api/core/media-assets', (req, res) => {
  try {
    const { property_id } = req.query;
    let query = 'SELECT * FROM MediaAssets';
    const params = [];
    if (property_id) {
      query += ' WHERE property_id = ?';
      params.push(property_id);
    }
    query += ' ORDER BY sort_order ASC, aesthetic_score DESC';
    const data = db.prepare(query).all(...params);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. TargetGroups Core API
app.get('/api/core/target-groups', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM TargetGroups ORDER BY active_score DESC').all().map(g => ({
      ...g,
      trained_time_slots: typeof g.trained_time_slots === 'string' ? JSON.parse(g.trained_time_slots || '[]') : g.trained_time_slots
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PostingSchedules Core API
app.get('/api/core/posting-schedules', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM PostingSchedules ORDER BY scheduled_time ASC').all().map(s => ({
      ...s,
      selected_media_ids: typeof s.selected_media_ids === 'string' ? JSON.parse(s.selected_media_ids || '[]') : s.selected_media_ids
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TargetGroups & PostingSchedules alias forwarders
app.use('/api/target-groups', (req, res, next) => {
  req.url = '/target-groups' + (req.url === '/' ? '' : req.url);
  return require('./routes/channelIntelligenceRoutes')(req, res, next);
});
app.get('/api/posting-schedules', (req, res, next) => {
  req.url = '/posting-schedules';
  return require('./routes/channelIntelligenceRoutes')(req, res, next);
});

// ---------------- MASTER REFACTOR: CORE AUTOMATION & INTELLIGENCE ENGINES ---------------- //
app.use('/api/location', require('./routes/locationRoutes'));
app.use('/api/accounts', require('./routes/accountPoolRoutes'));
app.use('/api/intelligence', require('./routes/channelIntelligenceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/leads', require('./routes/crmRoutes')); // Backward-compatibility
app.use('/api/automation', require('./routes/automationRoutes'));
app.use('/api/operations', require('./routes/operationsRoutes'));

// ==================== PHASE 4: DEDICATED POSTING AGENT API ==================== //

// Immediate trigger ("Đăng thử ngay lập tức") for a specific schedule
app.post('/api/publishing/post-now/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const result = await dedicatedPostingAgent.postNow(scheduleId);
    res.json(result);
  } catch (err) {
    console.error('[API post-now error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/publishing/post-now', async (req, res) => {
  try {
    const scheduleId = req.body.schedule_id || req.body.id;
    if (!scheduleId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã lịch đăng (schedule_id).' });
    }
    const result = await dedicatedPostingAgent.postNow(scheduleId);
    res.json(result);
  } catch (err) {
    console.error('[API post-now error]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Agent Status Endpoint
app.get('/api/publishing/agent-status', async (req, res) => {
  try {
    const station = await chromeStationService.checkStatus();
    const pendingCount = db.prepare("SELECT COUNT(*) as c FROM PostingSchedules WHERE status = 'Pending'").get().c;
    const publishedCount = db.prepare("SELECT COUNT(*) as c FROM PostingSchedules WHERE status = 'Published'").get().c;
    const failedCount = db.prepare("SELECT COUNT(*) as c FROM PostingSchedules WHERE status = 'Failed'").get().c;

    res.json({
      success: true,
      agent_active: true,
      station,
      stats: {
        pending: pendingCount,
        published: publishedCount,
        failed: failedCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend build if present
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/(api|uploads)).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  scheduler.start();
  dedicatedPostingAgent.start();
});
