const http = require('http');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { getAbsoluteMediaPath, uploadsDir } = require('./mediaHelper');

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3001, path: urlPath }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    }).on('error', reject);
  });
}

function getBinary(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3001, path: urlPath }, (res) => {
      let size = 0;
      res.on('data', chunk => size += chunk.length);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, size });
      });
    }).on('error', reject);
  });
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('KIỂM THỬ TỔNG THỂ GIAI ĐOẠN 1: CHUẨN HÓA DỮ LIỆU & 4 BẢNG CỐT LÕI');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      if (details) console.log(`       Evidence: ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (details) console.error(`       Details: ${details}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // PHẦN 1: XÓA SẠCH MOCK DATA
  // -------------------------------------------------------------
  console.log('--- 1. Kiểm tra xóa sạch 100% Mock Data trong Code & Database ---');
  const mockTargets = [
    '100088997766554',
    'UID_100088997766554_COOKIE',
    'fb_user_test_99',
    'Nguyễn Văn Test',
    'Meta Graph API v20.0'
  ];

  // Scan files in server & src
  let foundInCode = [];
  function scan(dir) {
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist') || dir.includes('.gemini')) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (/\.(js|jsx|ts|tsx|json|html)$/.test(e.name)) {
        if (p.includes('test-phase1-standardization.js')) continue;
        const text = fs.readFileSync(p, 'utf8');
        mockTargets.forEach(t => {
          if (text.includes(t)) foundInCode.push({ file: p, target: t });
        });
      }
    }
  }
  scan('.');

  assert(foundInCode.length === 0, 'Toàn bộ mã nguồn (Frontend & Backend) không còn chứa chuỗi mock data nào',
    foundInCode.length === 0 ? '0 chuỗi mock tìm thấy' : JSON.stringify(foundInCode));

  // Check Database for mock accounts
  const dbAccounts = db.prepare('SELECT * FROM account_sessions').all();
  const foundInDb = dbAccounts.filter(a => {
    const s = JSON.stringify(a);
    return mockTargets.some(t => s.includes(t));
  });
  assert(foundInDb.length === 0, 'Database SQLite không còn tài khoản test/mock nào',
    `Số tài khoản mock: ${foundInDb.length}`);

  // -------------------------------------------------------------
  // PHẦN 2: SỬA LỖI HIỂN THỊ ẢNH & PATH.RESOLVE CHO PLAYWRIGHT
  // -------------------------------------------------------------
  console.log('\n--- 2. Kiểm tra Hiển thị Ảnh & Hàm path.resolve Tuyệt Đối ---');

  // Test getAbsoluteMediaPath helper
  const imgFile1 = '1793263734174-843872878-Screenshot_2026-10-18_201112.png';
  const imgFile2 = '1793263780404-84769433-Screenshot__86_.png';

  const absPath1 = getAbsoluteMediaPath(imgFile1);
  const absPathOrig = getAbsoluteMediaPath('Screenshot_2026-10-18_201112.png');
  const absPathUrl = getAbsoluteMediaPath(`/uploads/${imgFile2}`);

  assert(path.isAbsolute(absPath1) && fs.existsSync(absPath1),
    'Backend trích xuất thành công đường dẫn tuyệt đối (path.resolve) cho ảnh Khai Sơn City (Full Name)',
    absPath1);

  assert(path.isAbsolute(absPathOrig) && fs.existsSync(absPathOrig),
    'Backend trích xuất thành công đường dẫn tuyệt đối ngay cả khi truyền Tên Gốc (Original Name)',
    absPathOrig);

  assert(path.isAbsolute(absPathUrl) && fs.existsSync(absPathUrl),
    'Backend trích xuất thành công đường dẫn tuyệt đối khi truyền URL /uploads/Screenshot__86_.png',
    absPathUrl);

  // Test static server HTTP 200
  const httpRes1 = await getBinary(`/uploads/${imgFile1}`);
  assert(httpRes1.status === 200 && httpRes1.headers['content-type'].includes('image'),
    'Cấu hình express.static trả về HTTP 200 và MIME image hợp lệ cho ảnh thực tế 1',
    `Status: ${httpRes1.status}, MIME: ${httpRes1.headers['content-type']}, Size: ${httpRes1.size} bytes`);

  const httpRes2 = await getBinary(`/uploads/${imgFile2}`);
  assert(httpRes2.status === 200 && httpRes2.headers['content-type'].includes('image'),
    'Cấu hình express.static trả về HTTP 200 và MIME image hợp lệ cho ảnh thực tế 2',
    `Status: ${httpRes2.status}, MIME: ${httpRes2.headers['content-type']}, Size: ${httpRes2.size} bytes`);

  // Test intelligent fallback HTTP 200 with original name
  const httpResOrig = await getBinary('/uploads/Screenshot_2026-10-18_201112.png');
  assert(httpResOrig.status === 200 && httpResOrig.headers['content-type'].includes('image'),
    'Middleware thông minh trả về ảnh thật ngay cả khi gọi bằng tên gốc không có timestamp',
    `Status: ${httpResOrig.status}, Size: ${httpResOrig.size} bytes`);

  // Test 404 handler for missing image
  const http404 = await getJson('/uploads/non_existent_image_xyz123.jpg');
  assert(http404.status === 404 && http404.data?.error === 'IMAGE_NOT_FOUND',
    'Xử lý 404 rõ ràng chuẩn JSON khi ảnh không tồn tại trên máy chủ',
    `HTTP Status: ${http404.status}, Error Code: ${http404.data?.error}`);

  // Test /api/media/absolute-path endpoint
  const absApiRes = await getJson(`/api/media/absolute-path?file=${encodeURIComponent(imgFile1)}`);
  assert(absApiRes.status === 200 && absApiRes.data?.exists === true && path.isAbsolute(absApiRes.data?.absolute_path),
    'API trích xuất đường dẫn tuyệt đối cho Playwright hoạt động chính xác qua HTTP',
    `Absolute Path: ${absApiRes.data?.absolute_path}`);

  // -------------------------------------------------------------
  // PHẦN 3: CHUẨN HÓA CẤU TRÚC DATABASE (4 BẢNG CỐT LÕI)
  // -------------------------------------------------------------
  console.log('\n--- 3. Kiểm tra Chuẩn Hóa Cấu Trúc Database (4 Bảng Cốt Lõi) ---');

  // 1. Table Properties
  const propCols = db.prepare('PRAGMA table_info(Properties)').all().map(c => c.name);
  const requiredPropCols = ['id', 'title', 'raw_content', 'price', 'area', 'city', 'district', 'ward', 'property_type', 'extracted_tags', 'status'];
  const hasAllPropCols = requiredPropCols.every(c => propCols.includes(c));
  assert(hasAllPropCols, 'Bảng Properties chứa đầy đủ tất cả các trường theo yêu cầu',
    `Trường: ${propCols.join(', ')}`);

  const propSample = db.prepare('SELECT * FROM Properties WHERE id = ?').get('sample-listing-1');
  assert(propSample && propSample.title.includes('Khai Sơn City') && propSample.city === 'Hà Nội',
    'Bảng Properties lưu trữ chính xác tin bất động sản Khai Sơn City có dấu tiếng Việt UTF-8',
    `Title: ${propSample?.title}, City: ${propSample?.city}, District: ${propSample?.district}`);

  // 2. Table MediaAssets
  const mediaCols = db.prepare('PRAGMA table_info(MediaAssets)').all().map(c => c.name);
  const requiredMediaCols = ['id', 'property_id', 'file_path', 'detected_category', 'aesthetic_score', 'relevance_score', 'is_selected', 'sort_order'];
  const hasAllMediaCols = requiredMediaCols.every(c => mediaCols.includes(c));
  assert(hasAllMediaCols, 'Bảng MediaAssets chứa đầy đủ tất cả các trường theo yêu cầu',
    `Trường: ${mediaCols.join(', ')}`);

  const mediaList = db.prepare('SELECT * FROM MediaAssets WHERE property_id = ? ORDER BY sort_order ASC').all('sample-listing-1');
  assert(mediaList.length >= 2, 'Bảng MediaAssets liên kết đầy đủ các ảnh thực tế với tin Khai Sơn City',
    `Số lượng ảnh: ${mediaList.length}`);

  const coverAsset = mediaList[0];
  assert(coverAsset && coverAsset.sort_order === 0 && fs.existsSync(coverAsset.file_path),
    'Ảnh bìa (sort_order = 0) có đường dẫn tệp thực tế tồn tại trên ổ cứng',
    `ID: ${coverAsset?.id}, Category: ${coverAsset?.detected_category}, Path: ${coverAsset?.file_path}`);

  // 3. Table TargetGroups
  const groupCols = db.prepare('PRAGMA table_info(TargetGroups)').all().map(c => c.name);
  const requiredGroupCols = ['id', 'group_name', 'group_url', 'target_city', 'target_property_type', 'active_score', 'approval_latency_minutes', 'trained_time_slots'];
  const hasAllGroupCols = requiredGroupCols.every(c => groupCols.includes(c));
  assert(hasAllGroupCols, 'Bảng TargetGroups chứa đầy đủ tất cả các trường theo yêu cầu',
    `Trường: ${groupCols.join(', ')}`);

  const groupSample = db.prepare('SELECT * FROM TargetGroups LIMIT 1').get();
  let timeSlots = [];
  try { timeSlots = JSON.parse(groupSample.trained_time_slots); } catch (_) {}
  assert(groupSample && Array.isArray(timeSlots) && timeSlots.length > 0,
    'Bảng TargetGroups lưu trữ mảng JSON các khung giờ vàng (trained_time_slots)',
    `Group: ${groupSample?.group_name}, Time Slots: ${JSON.stringify(timeSlots)}`);

  // 4. Table PostingSchedules
  const schedCols = db.prepare('PRAGMA table_info(PostingSchedules)').all().map(c => c.name);
  const requiredSchedCols = ['id', 'property_id', 'group_id', 'selected_media_ids', 'scheduled_time', 'status', 'published_url', 'error_log'];
  const hasAllSchedCols = requiredSchedCols.every(c => schedCols.includes(c));
  assert(hasAllSchedCols, 'Bảng PostingSchedules chứa đầy đủ tất cả các trường theo yêu cầu',
    `Trường: ${schedCols.join(', ')}`);

  const schedCount = db.prepare('SELECT COUNT(*) as count FROM PostingSchedules').get().count;
  assert(schedCount > 0, 'Bảng PostingSchedules đồng bộ thành công các tác vụ lịch đăng',
    `Tổng số lịch đăng: ${schedCount}`);

  // Verify REST APIs for 4 Core Tables
  const corePropRes = await getJson('/api/core/properties');
  assert(corePropRes.status === 200 && corePropRes.data?.success && corePropRes.data?.data?.length > 0,
    'Endpoint GET /api/core/properties hoạt động hoàn hảo',
    `Tổng số: ${corePropRes.data?.count}`);

  const coreMediaRes = await getJson('/api/core/media-assets?property_id=sample-listing-1');
  assert(coreMediaRes.status === 200 && coreMediaRes.data?.success && coreMediaRes.data?.data?.length > 0,
    'Endpoint GET /api/core/media-assets hoạt động hoàn hảo',
    `Tổng số media: ${coreMediaRes.data?.count}`);

  const coreGroupsRes = await getJson('/api/core/target-groups');
  assert(coreGroupsRes.status === 200 && coreGroupsRes.data?.success && coreGroupsRes.data?.data?.length > 0,
    'Endpoint GET /api/core/target-groups hoạt động hoàn hảo',
    `Tổng số nhóm: ${coreGroupsRes.data?.count}`);

  const coreSchedRes = await getJson('/api/core/posting-schedules');
  assert(coreSchedRes.status === 200 && coreSchedRes.data?.success,
    'Endpoint GET /api/core/posting-schedules hoạt động hoàn hảo',
    `Tổng số lịch: ${coreSchedRes.data?.count}`);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`TỔNG SỐ BÀI KIỂM THỬ: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
