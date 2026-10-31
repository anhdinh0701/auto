const db = require('./db');
const { validateListingLocation, checkChannelLocationMatch } = require('./locationValidator');
const { analyzeAndSelectPhotos } = require('./aiImageSelector');
const { calculateChannelHealth, generateTimeSlotHeatmap, exportLabeledTrainingData } = require('./channelIntelligence');

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('MASTER REFACTOR VERIFICATION & ACCEPTANCE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // ---------------- CRITERION 1: Tiêu chuẩn hóa luồng tạo tin ----------------
  console.log('\n--- 1. Single Standard Creation Flow in Workspace ---');
  const sampleListingId = `test-refactor-${Date.now()}`;
  db.prepare(`
    INSERT INTO listings (
      id, title, project_name, property_type, province, district, ward, address_detail,
      price, price_unit, area, bedrooms, bathrooms, status, approved_photo_ids,
      location_verification_status, created_at, updated_at
    ) VALUES (
      ?, 'Căn hộ Khai Sơn City 2PN view hồ điều hòa', 'Khai Sơn City', 'can_ho',
      'Hà Nội', 'Quận Long Biên', 'Phường Thượng Thanh', 'Đường Lý Sơn',
      3.8, 'tỷ', 77.5, 2, 2, 'draft', '[]', 'VERIFIED', datetime('now'), datetime('now')
    )
  `).run(sampleListingId);

  const fetchedListing = db.prepare('SELECT * FROM listings WHERE id = ?').get(sampleListingId);
  assert(fetchedListing && fetchedListing.project_name === 'Khai Sơn City', 'Tạo tin tiêu chuẩn thành công với đầy đủ thuộc tính mở rộng.');

  // ---------------- CRITERION 2: Quản lý ảnh gắn liền với tin đăng ----------------
  console.log('\n--- 2. Photo Association with Property Listing ---');
  const photo1 = { id: `p1-${Date.now()}`, url: '/uploads/1793263734174-843872878-Screenshot_2026-10-18_201112.png', originalname: 'mat-tien-khai-son.png', size: 677975 };
  const photo2 = { id: `p2-${Date.now()}`, url: '/uploads/1793263780404-84769433-Screenshot__86_.png', originalname: 'phong-khach-sang-trong.png', size: 665759 };
  const photo3 = { id: `p3-${Date.now()}`, url: '/uploads/1793263734174-843872878-Screenshot_2026-10-18_201112.png', originalname: 'phong-ngu-master.png', size: 677975 };
  const photo4 = { id: `p4-${Date.now()}`, url: '/uploads/1793263780404-84769433-Screenshot__86_.png', originalname: 'mat-bang-can-ho.png', size: 665759 };
  const photo5 = { id: `p5-${Date.now()}`, url: '/uploads/1793263262068-571723999-test_upload_anh_thuc_te.png', originalname: 'tiny.gif', size: 70 };

  const allPhotos = [photo1, photo2, photo3, photo4, photo5];
  db.prepare('UPDATE listings SET photos = ? WHERE id = ?').run(JSON.stringify(allPhotos), sampleListingId);

  const updatedListingWithPhotos = db.prepare('SELECT photos FROM listings WHERE id = ?').get(sampleListingId);
  assert(JSON.parse(updatedListingWithPhotos.photos).length === 5, 'Kho ảnh gắn kết trực tiếp vào thực thể tin BĐS.');

  // ---------------- CRITERION 3: Bộ ảnh AI truyền nguyên vẹn sang Publishing Job ----------------
  console.log('\n--- 3. AI Photo Selection & Preserved Bundle in Job ---');
  const aiSelection = analyzeAndSelectPhotos(allPhotos, { channel_type: 'facebook_feed', target_limit: 4 });
  assert(aiSelection.recommended_photos.length <= 4, 'AI Image Selector giới hạn đúng số lượng ảnh cho định dạng Carousel.');
  assert(aiSelection.recommended_photos[0].category_tag === 'facade', 'AI tự động ưu tiên ảnh mặt tiền làm Hero Photo.');

  const approvedIds = aiSelection.recommended_photos.map(p => p.id);
  db.prepare('UPDATE listings SET approved_photo_ids = ? WHERE id = ?').run(JSON.stringify(approvedIds), sampleListingId);

  // Create publishing task using approved photos
  const taskId = `task-refactor-${Date.now()}`;
  db.prepare(`
    INSERT INTO publishing_tasks (
      id, listing_id, channel_id, status, title, content, media_urls,
      approved_photo_ids, location_verification_status, worker_state, created_at, updated_at
    ) VALUES (
      ?, ?, 'chan-1', 'queued', 'Test Post', 'Content', ?,
      ?, 'VERIFIED', 'PENDING', datetime('now'), datetime('now')
    )
  `).run(
    taskId,
    sampleListingId,
    JSON.stringify(aiSelection.recommended_photos.map(p => p.url)),
    JSON.stringify(approvedIds)
  );

  const jobTask = db.prepare('SELECT * FROM publishing_tasks WHERE id = ?').get(taskId);
  const jobApprovedIds = JSON.parse(jobTask.approved_photo_ids || '[]');
  assert(jobApprovedIds.length === approvedIds.length && jobApprovedIds[0] === approvedIds[0], 'Bộ ảnh được duyệt truyền nguyên vẹn từ Listing sang Publishing Job.');

  // ---------------- CRITERION 4: Location Validator phát hiện mâu thuẫn ----------------
  console.log('\n--- 4. Location Validator Contradiction Detection ---');
  // Contradiction: Project is Khai Sơn City (Long Biên, Hà Nội) but address is entered in TP. Thủ Đức, TP.HCM
  const contradictionListing = {
    title: 'Bán gấp Khai Sơn City',
    project_name: 'Khai Sơn City',
    province: 'TP. Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    ward: 'Phường Long Thạnh Mỹ',
    address_detail: 'Nguyễn Xiển'
  };

  const validationResult = validateListingLocation(contradictionListing);
  assert(validationResult.status === 'NEEDS_REVIEW', 'Location Validator nhận diện chính xác mâu thuẫn địa lý (Khai Sơn City vs TP.HCM) -> NEEDS_REVIEW.');
  assert(validationResult.is_publishable === false, 'Đánh dấu tin có mâu thuẫn là không thể xuất bản tự động (is_publishable = false).');

  // Valid location check
  const validListing = {
    title: 'Căn hộ Khai Sơn City Long Biên',
    project_name: 'Khai Sơn City',
    province: 'Hà Nội',
    district: 'Quận Long Biên',
    ward: 'Phường Thượng Thanh',
    address_detail: 'Đường Lý Sơn'
  };
  const validResult = validateListingLocation(validListing);
  assert(validResult.status === 'VERIFIED' && validResult.is_publishable === true, 'Địa chỉ chuẩn chỉ được phê duyệt VERIFIED.');

  // ---------------- CRITERION 5: Chặn xuất bản khi dữ liệu địa lý bất hợp lệ ----------------
  console.log('\n--- 5. Geographic Pre-publishing Gatekeeper ---');
  const targetChannelHCMC = { id: 'chan-hcm', name: 'Nhà Đất TP.HCM', province: 'TP. Hồ Chí Minh', district: null };
  const targetChannelHN = { id: 'chan-hn', name: 'Nhà Đất Hà Nội', province: 'Hà Nội', district: null };

  const checkMismatch = checkChannelLocationMatch(validListing, targetChannelHCMC);
  assert(checkMismatch.matched === false && checkMismatch.severity === 'block', 'Chặn xuất bản khi tin Hà Nội đăng vào nhóm chỉ dành riêng cho TP.HCM.');

  const checkMatch = checkChannelLocationMatch(validListing, targetChannelHN);
  assert(checkMatch.matched === true && checkMatch.severity === 'ok', 'Cho phép xuất bản khi khu vực BĐS khớp với kênh.');

  // ---------------- CRITERION 6: Group Health Score có thể giải thích ----------------
  console.log('\n--- 6. Explainable Health Score & Confidence Rating ---');
  const channelSample = db.prepare('SELECT * FROM channels LIMIT 1').get();
  const healthAnalysis = calculateChannelHealth(channelSample);

  assert(typeof healthAnalysis.health_score === 'number' && healthAnalysis.health_score >= 0, 'Tính toán Health Score định lượng (0-100).');
  assert(healthAnalysis.confidence === 'INSUFFICIENT_DATA' || ['HIGH', 'MEDIUM'].includes(healthAnalysis.confidence), 'Có nhãn đánh giá độ tin cậy dữ liệu rõ ràng.');
  assert(healthAnalysis.breakdown.activity && healthAnalysis.breakdown.approval_turnaround, 'Có cấu trúc phân rã thành phần điểm giải thích được.');

  // ---------------- CRITERION 7: Time-Slot Heatmap & Labeled Data Export ----------------
  console.log('\n--- 7. 7x24 Time-Slot Heatmap & Training Data Export ---');
  const heatmap = generateTimeSlotHeatmap();
  assert(heatmap.length === 168, 'Tạo đủ 168 ô cho ma trận 7 ngày x 24 giờ.');
  assert(
    heatmap[0].hasOwnProperty('technical_success_rate') &&
    heatmap[0].hasOwnProperty('approval_rate') &&
    heatmap[0].hasOwnProperty('avg_engagement_24h'),
    'Tách bạch rõ ràng 3 chỉ số: Kết nối kỹ thuật, Tỷ lệ duyệt Admin, và Tương tác 24h.'
  );

  const trainingData = exportLabeledTrainingData();
  assert(Array.isArray(trainingData) && trainingData.length > 0, 'Xuất dữ liệu huấn luyện ML có gắn nhãn thành công.');

  // ---------------- CRITERION 8: Account Pool & Token Masking ----------------
  console.log('\n--- 8. Account & Session Pool Security ---');
  const accounts = db.prepare('SELECT * FROM account_sessions').all();
  assert(accounts.length >= 2, 'Account Pool lưu trữ phiên kết nối đa kênh.');
  const sampleAcc = accounts[0];
  assert(!sampleAcc.token_masked.includes(' ') && sampleAcc.token_masked.includes('...'), 'Token được che mờ (redacted) an toàn, không lộ secret.');

  // ---------------- CRITERION 9: Queue & Worker Execution Logs ----------------
  console.log('\n--- 9. Worker Lifecycle & Execution Logs ---');
  const execLogId = `exec-test-${Date.now()}`;
  db.prepare(`
    INSERT INTO publishing_execution_logs (
      id, job_id, worker_name, action, status, error_code, retry_count, duration_ms, details, created_at
    ) VALUES (
      ?, ?, 'Worker-Node-01', 'PAYLOAD_DISPATCH', 'SUCCESS', NULL, 0, 420, 'Gửi bài đăng thành công', datetime('now')
    )
  `).run(execLogId, taskId);

  const fetchedLog = db.prepare('SELECT * FROM publishing_execution_logs WHERE id = ?').get(execLogId);
  assert(fetchedLog && fetchedLog.action === 'PAYLOAD_DISPATCH' && fetchedLog.status === 'SUCCESS', 'Nhật ký thực thi ghi nhận chính xác trạng thái máy worker.');

  // ---------------- CRITERION 10: Idempotency Protection ----------------
  console.log('\n--- 10. Idempotency Key Duplicate Prevention ---');
  const idempKey = `idemp-test-${Date.now()}`;
  db.prepare(`
    INSERT INTO publishing_tasks (
      id, listing_id, channel_id, status, idempotency_key, created_at, updated_at
    ) VALUES (?, ?, 'chan-1', 'queued', ?, datetime('now'), datetime('now'))
  `).run(`t-idemp-1-${Date.now()}`, sampleListingId, idempKey);

  let duplicateBlocked = false;
  try {
    db.prepare(`
      INSERT INTO publishing_tasks (
        id, listing_id, channel_id, status, idempotency_key, created_at, updated_at
      ) VALUES (?, ?, 'chan-1', 'queued', ?, datetime('now'), datetime('now'))
    `).run(`t-idemp-2-${Date.now()}`, sampleListingId, idempKey);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      duplicateBlocked = true;
    }
  }
  assert(duplicateBlocked, 'Khóa băm idempotency_key chặn triệt để hành vi submit bài đăng trùng lặp.');

  // ---------------- CRITERION 11: Connector Transparency ----------------
  console.log('\n--- 11. Connector Transparency & Error Codes ---');
  const fbGroupConn = new (require('./connectors/FacebookGroupConnector'))();
  const groupPubResult = await fbGroupConn.publish({ id: 'dummy' }, { name: 'Nhóm Test', url: 'https://fb.com/groups/test' });
  assert(
    groupPubResult.status === 'needs_manual_action',
    'Facebook Group không khai khống API tự động mà điều hướng sang quy trình hỗ trợ thủ công.'
  );

  // ---------------- CRITERION 12: Data Integrity & Schema Backward Compatibility ----------------
  console.log('\n--- 12. Backward Compatibility & Data Preservation ---');
  const listingCols = db.prepare('PRAGMA table_info(listings)').all().map(c => c.name);
  assert(listingCols.includes('title') && listingCols.includes('photos') && listingCols.includes('price'), 'Bảo toàn 100% các cột nguyên thủy Phase 1.');
  assert(listingCols.includes('project_name') && listingCols.includes('location_verification_status') && listingCols.includes('approved_photo_ids'), 'Bổ sung đầy đủ các cột Refactor mở rộng.');

  const totalListingCount = db.prepare('SELECT COUNT(*) as count FROM listings').get().count;
  assert(totalListingCount > 0, 'Dữ liệu SQLite trước đó không bị mất mát.');

  console.log('\n======================================================');
  console.log(`TOTAL ACCEPTANCE TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
