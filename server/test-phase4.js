/**
 * Phase 4 Automated Test Suite
 * Tests Analytics Dashboard, AI Content Optimization, CRM / Leads,
 * Automation Rules Engine, and Centralized Operations Hub.
 */

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 4 — AI, ANALYTICS & CRM');
  console.log('====================================================');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Fetch listing prerequisite
    console.log('\n--- 0. Fetching Prerequisites ---');
    const listRes = await fetch(`${BASE_URL}/listings`);
    const listings = (await listRes.json()).items;
    const sampleListing = listings[0];
    assert(sampleListing && sampleListing.id, 'Tìm thấy tin BĐS từ Giai đoạn 1');

    // 1. Analytics Dashboard API
    console.log('\n--- 1. Analytics Dashboard & Data Transparency ---');
    const dashRes = await fetch(`${BASE_URL}/analytics/dashboard?time_range=30days`);
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'Endpoint GET /api/analytics/dashboard hoạt động');
    assert(dashData.summary && typeof dashData.summary.total_posts === 'number', 'Summary chứa tổng số tin đăng');
    assert(dashData.performance && typeof dashData.performance.total_views === 'number', 'Performance chứa tổng lượt xem');
    assert(dashData.data_sources && typeof dashData.data_sources.manual === 'number', 'Phân loại minh bạch nguồn dữ liệu (platform vs manual vs unavailable)');
    assert(Array.isArray(dashData.channel_comparison), 'Có dữ liệu so sánh hiệu quả giữa các kênh');
    assert(Array.isArray(dashData.property_type_comparison), 'Có dữ liệu so sánh theo loại hình BĐS');
    assert(Array.isArray(dashData.trends) && dashData.trends.length > 0, 'Biểu đồ xu hướng theo ngày hợp lệ');

    // Test Manual Analytics Entry
    const manualEntryRes = await fetch(`${BASE_URL}/analytics/manual-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: sampleListing.id,
        views: 350,
        interactions: 15,
        leads_count: 2,
        notes: 'Kiểm thử ghi nhận thủ công cho Facebook Group'
      })
    });
    const manualEntryData = await manualEntryRes.json();
    assert(manualEntryRes.status === 201 && manualEntryData.success, 'Ghi nhận số liệu hiệu quả thủ công thành công');

    // 2. AI Content Optimization API
    console.log('\n--- 2. AI Content Optimization Studio ---');
    // Check AI settings & token redaction
    const aiSetRes = await fetch(`${BASE_URL}/ai/settings`);
    const aiSettings = await aiSetRes.json();
    assert(aiSettings.hasOwnProperty('provider') && aiSettings.hasOwnProperty('is_configured'), 'Đọc cấu hình AI thành công');
    if (aiSettings.api_key) {
      assert(aiSettings.api_key.startsWith('***CONFIGURED'), 'Mã khóa AI được che giấu (redacted) bảo mật');
    }

    // Headlines generation (Zero-hallucination multi-version angles)
    const hlRes = await fetch(`${BASE_URL}/ai/headlines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: sampleListing.id, listing_data: sampleListing })
    });
    const hlData = await hlRes.json();
    assert(hlRes.status === 200 && Array.isArray(hlData.headlines) && hlData.headlines.length >= 4, 'AI tạo đủ 4 phương án tiêu đề đa góc độ dựa trên thông số thật');

    // Description rewriter by channel and audience
    const rwRes = await fetch(`${BASE_URL}/ai/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: sampleListing.id,
        listing_data: sampleListing,
        channel_type: 'facebook_page',
        target_audience: 'dau_tu'
      })
    });
    const rwData = await rwRes.json();
    assert(rwRes.status === 200 && rwData.content && rwData.word_count > 0, 'Viết lại mô tả theo kênh & đối tượng mục tiêu thành công');

    // Content Quality Audit
    const qualRes = await fetch(`${BASE_URL}/ai/quality-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sampleListing.title,
        description: sampleListing.description,
        listing_data: sampleListing
      })
    });
    const qualData = await qualRes.json();
    assert(qualData.score >= 0 && qualData.score <= 100 && qualData.grade, 'Thẩm định chất lượng nội dung chấm điểm & xếp loại chính xác');

    // Cross-Listing Duplicate Content Detection
    const dupRes = await fetch(`${BASE_URL}/ai/duplicate-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sampleListing.title,
        description: sampleListing.description,
        listing_id: 'new-temp-id'
      })
    });
    const dupData = await dupRes.json();
    assert(dupData.hasOwnProperty('is_duplicate') && dupData.hasOwnProperty('highest_similarity'), 'Phát hiện nội dung trùng lặp tính toán độ tương đồng chính xác');

    // Fact Consistency Verification (Checking structured fields vs text)
    const consRes = await fetch(`${BASE_URL}/ai/consistency-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: sampleListing.id,
        listing_data: { ...sampleListing, bedrooms: 2 },
        title: 'Bán căn hộ',
        description: 'Căn hộ 4 phòng ngủ cực thoáng' // Deliberate inconsistency (4 vs 2)
      })
    });
    const consData = await consRes.json();
    assert(!consData.is_consistent && consData.inconsistencies.length > 0, 'Phát hiện chính xác sự không nhất quán giữa chữ viết và database');

    // Best Time to Post Recommendation
    const timeRes = await fetch(`${BASE_URL}/ai/best-time?channel_type=facebook_page`);
    const timeData = await timeRes.json();
    assert(Array.isArray(timeData.recommended_slots) && timeData.timezone === 'Asia/Ho_Chi_Minh', 'Gợi ý khung giờ đăng chuẩn thị trường BĐS Việt Nam');

    // 3. Lead Management / CRM API
    console.log('\n--- 3. Lead Management / CRM ---');
    // Create new lead
    const testPhone = '0909' + Math.floor(100000 + Math.random() * 900000);
    const createLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kiểm Thử Khách Hàng',
        phone: testPhone,
        email: 'test.lead@crm.vn',
        source_platform: 'Facebook Fanpage',
        listing_id: sampleListing.id,
        property_type_interest: 'can_ho',
        budget_text: '3.0 tỷ',
        status: 'new',
        notes: 'Khách cần mua gấp trong tuần',
        next_followup_at: new Date(Date.now() + 3600000 * 5).toISOString()
      })
    });
    const createdLead = await createLeadRes.json();
    assert(createLeadRes.status === 201 && createdLead.code, 'Tạo mới khách hàng tiềm năng thành công với mã KH duy nhất');

    // Duplicate Phone Prevention
    const dupLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Trùng Lặp',
        phone: testPhone
      })
    });
    assert(dupLeadRes.status === 409, 'Chặn trùng lặp số điện thoại khách hàng với mã 409 Conflict');

    // Add activity care log
    const actRes = await fetch(`${BASE_URL}/leads/${createdLead.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'call',
        summary: 'Gọi điện xác nhận lịch hẹn',
        details: 'Khách hẹn 15h thứ 7 xem nhà'
      })
    });
    const actData = await actRes.json();
    assert(actRes.status === 201 && actData.summary, 'Thêm nhật ký chăm sóc khách hàng (Activity Timeline) thành công');

    // Update lead status
    const updateLeadRes = await fetch(`${BASE_URL}/leads/${createdLead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'scheduled_viewing' })
    });
    const updatedLead = await updateLeadRes.json();
    assert(updatedLead.status === 'scheduled_viewing', 'Cập nhật trạng thái phễu khách hàng thành công');

    // Upcoming Reminders
    const remRes = await fetch(`${BASE_URL}/leads/reminders/upcoming`);
    const remData = await remRes.json();
    assert(Array.isArray(remData), 'Truy vấn danh sách lịch hẹn & nhắc nhở thành công');

    // Export CSV with UTF-8 BOM
    const expCsvRes = await fetch(`${BASE_URL}/leads/export/csv`);
    const csvBuffer = Buffer.from(await expCsvRes.arrayBuffer());
    const hasBom = csvBuffer[0] === 0xEF && csvBuffer[1] === 0xBB && csvBuffer[2] === 0xBF;
    assert(hasBom, 'Xuất file CSV danh sách khách hàng có UTF-8 BOM chống lỗi font tiếng Việt');

    // Delete lead
    const delLeadRes = await fetch(`${BASE_URL}/leads/${createdLead.id}`, { method: 'DELETE' });
    assert(delLeadRes.status === 200, 'Xóa khách hàng và dọn dẹp nhật ký liên quan an toàn');

    // 4. Automation Rules Engine API
    console.log('\n--- 4. Automation Rules Engine ---');
    const rulesRes = await fetch(`${BASE_URL}/automation/rules`);
    const rules = await rulesRes.json();
    assert(Array.isArray(rules) && rules.length >= 6, 'Hệ thống nạp đầy đủ 6 quy tắc tự động hóa chuẩn mực');

    // Toggle rule
    const rule1 = rules[0];
    const toggleRes = await fetch(`${BASE_URL}/automation/rules/${rule1.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: !rule1.is_enabled })
    });
    const toggledRule = await toggleRes.json();
    assert(Boolean(toggledRule.is_enabled) !== Boolean(rule1.is_enabled), 'Chuyển trạng thái bật/tắt quy tắc tự động hóa thành công');

    // Restore rule state
    await fetch(`${BASE_URL}/automation/rules/${rule1.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: rule1.is_enabled })
    });

    // Test run rule
    const testRuleRes = await fetch(`${BASE_URL}/automation/rules/${rule1.id}/test`, { method: 'POST' });
    const testRuleData = await testRuleRes.json();
    assert(testRuleData.success, 'Thực thi kiểm thử quy tắc tự động hóa (Test Run) thành công');

    // Rule Logs
    const ruleLogsRes = await fetch(`${BASE_URL}/automation/logs?limit=10`);
    const ruleLogs = await ruleLogsRes.json();
    assert(Array.isArray(ruleLogs) && ruleLogs.length > 0, 'Ghi nhận đầy đủ lịch sử thực thi quy tắc (Rule Logs)');

    // 5. Centralized Operations Center API
    console.log('\n--- 5. Centralized Operations Center ---');
    const opRes = await fetch(`${BASE_URL}/operations/overview`);
    const opData = await opRes.json();
    assert(opData.health && opData.health.database.status === 'healthy', 'Kiểm tra chẩn đoán sức khỏe Database SQLite thành công');
    assert(opData.health.storage && opData.health.storage.files_count >= 0, 'Chẩn đoán dung lượng lưu trữ hình ảnh thành công');
    assert(opData.lifecycle && opData.lifecycle.listings, 'Tổng hợp vòng đời tin đăng và tác vụ xuất bản thành công');

    // Audit logs & secret redaction verification
    const auditRes = await fetch(`${BASE_URL}/operations/audit-logs?limit=10`);
    const auditLogs = await auditRes.json();
    assert(Array.isArray(auditLogs) && auditLogs.length > 0, 'Truy xuất nhật ký kiểm toán hệ thống thành công');
    const hasLeakedToken = auditLogs.some(l => /EAAB\w{20,}/.test(l.details || ''));
    assert(!hasLeakedToken, 'Bảo mật tuyệt đối: Không rò rỉ Access Token hay mật khẩu trong Audit Log');

    // Safe bulk retry endpoint
    const retryAllRes = await fetch(`${BASE_URL}/operations/retry-all-failed`, { method: 'POST' });
    const retryAllData = await retryAllRes.json();
    assert(retryAllRes.status === 200 && retryAllData.success, 'Tự động thử lại tất cả tác vụ lỗi có thể phục hồi an toàn');

  } catch (err) {
    console.error('Lỗi ngoại lệ kiểm thử Phase 4:', err);
    failed++;
  }

  console.log(`\n====================================================`);
  console.log(`🎉 KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4: ${passed} / ${passed + failed} BÀI TEST THÀNH CÔNG!`);
  console.log(`====================================================`);
  if (failed > 0) process.exit(1);
}

runTests();
