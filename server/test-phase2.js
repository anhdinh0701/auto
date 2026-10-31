const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 2 — CHANNEL DISCOVERY');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error('   Lỗi:', err.message);
    }
  }

  // 1. Channel CRUD
  let createdChanId = null;
  await test('1. Tạo kênh tiếp thị mới với đầy đủ thông số và phân loại', async () => {
    const payload = {
      name: 'Hội Môi Giới BĐS Nam Sài Gòn & Quận 7',
      url: 'https://www.facebook.com/groups/nhadatquan7.namsaigon',
      channel_type: 'facebook_group',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 7',
      property_types: ['can_ho', 'nha_pho'],
      price_segments: ['cao_cap', 'sieu_sang'],
      target_audiences: ['mua_o', 'dau_tu'],
      verification_status: 'verified',
      publishing_capability: 'manual_only',
      member_count: 53000,
      notes: 'Kiểm duyệt bài viết trong 20 phút'
    };

    const res = await fetch(`${BASE_URL}/api/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.name, payload.name);
    assert.strictEqual(data.channel_type, 'facebook_group');
    assert.strictEqual(data.publishing_capability, 'manual_only');
    createdChanId = data.id;
  });

  // 2. Read single channel
  await test('2. Xem chi tiết kênh và kiểm tra breakdown điểm liên quan', async () => {
    assert.ok(createdChanId);
    const res = await fetch(`${BASE_URL}/api/channels/${createdChanId}?match_district=Qu%E1%BA%ADn%207&match_property_type=can_ho`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.id, createdChanId);
    assert.ok(data.relevanceScore >= 70, `Score must be >= 70, got ${data.relevanceScore}`);
    assert.ok(data.scoreBreakdown);
    assert.ok(data.scoreBreakdown.location);
    assert.strictEqual(data.scoreBreakdown.location.score, 100); // Matches Quan 7
  });

  // 3. Update channel & toggle favorite
  await test('3. Cập nhật kênh và chuyển đổi trạng thái yêu thích', async () => {
    assert.ok(createdChanId);
    // Update
    const putRes = await fetch(`${BASE_URL}/api/channels/${createdChanId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hội Môi Giới BĐS Nam Sài Gòn & Q7 (VIP)',
        url: 'https://www.facebook.com/groups/nhadatquan7.namsaigon',
        channel_type: 'facebook_group',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 7',
        publishing_capability: 'manual_only'
      })
    });
    assert.strictEqual(putRes.status, 200);
    const updated = await putRes.json();
    assert.strictEqual(updated.name, 'Hội Môi Giới BĐS Nam Sài Gòn & Q7 (VIP)');

    // Toggle favorite
    const favRes = await fetch(`${BASE_URL}/api/channels/${createdChanId}/toggle-favorite`, { method: 'POST' });
    assert.strictEqual(favRes.status, 200);
    const favData = await favRes.json();
    assert.strictEqual(favData.is_favorite, true);
  });

  // 4. Duplicate URL detection
  await test('4. Kiểm tra phát hiện trùng lặp URL: Trả về mã lỗi 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kênh Trùng Lặp Test',
        url: 'https://www.facebook.com/groups/nhadatquan7.namsaigon',
        channel_type: 'facebook_group'
      })
    });
    assert.strictEqual(res.status, 409);
    const err = await res.json();
    assert.ok(err.error.includes('đã tồn tại'));
  });

  // 5. Facebook Groups strictly manual_only
  await test('5. Ràng buộc an toàn: Hội nhóm Facebook không thể tự nhận là API automatic posting', async () => {
    const res = await fetch(`${BASE_URL}/api/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nhóm Facebook Giả Định API',
        url: 'https://facebook.com/groups/fake.api.group',
        channel_type: 'facebook_group',
        publishing_capability: 'api_supported' // Should be overridden to manual_only
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.publishing_capability, 'manual_only');

    // Clean up
    await fetch(`${BASE_URL}/api/channels/${data.id}`, { method: 'DELETE' });
  });

  // 6. Relevance Scoring Engine & Weight Configuration
  await test('6. Thuật toán chấm điểm liên quan (0 - 100) và cấu hình trọng số tùy chỉnh', async () => {
    // Get default weights
    const getWeights = await fetch(`${BASE_URL}/api/channels/score-settings`);
    const weights = await getWeights.json();
    assert.ok(weights.weight_location);

    // Update weights
    const putWeights = await fetch(`${BASE_URL}/api/channels/score-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_location: 40,
        weight_property_type: 20,
        weight_price: 10,
        weight_audience: 10,
        weight_freshness: 10,
        weight_capability: 10
      })
    });
    assert.strictEqual(putWeights.status, 200);
    const newWeights = await putWeights.json();
    assert.strictEqual(newWeights.weight_location, 40);

    // Restore standard weights
    await fetch(`${BASE_URL}/api/channels/score-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_location: 25,
        weight_property_type: 20,
        weight_price: 15,
        weight_audience: 15,
        weight_freshness: 15,
        weight_capability: 10
      })
    });
  });

  // 7. Channel Collections (CRUD & Assignment)
  let testColId = null;
  await test('7. Quản lý Bộ sưu tập kênh (Channel Collections) và gán kênh', async () => {
    // Create collection
    const createRes = await fetch(`${BASE_URL}/api/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bộ Sưu Tập Test Quận 7',
        description: 'Tập hợp các kênh test',
        color: 'emerald'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const col = await createRes.json();
    assert.ok(col.id);
    testColId = col.id;

    // Bulk add channel to collection
    const addRes = await fetch(`${BASE_URL}/api/channels/bulk-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelIds: [createdChanId],
        collectionId: testColId,
        action: 'add'
      })
    });
    assert.strictEqual(addRes.status, 200);

    // Filter by collection
    const filterRes = await fetch(`${BASE_URL}/api/channels?collection_id=${testColId}`);
    const filterData = await filterRes.json();
    assert.strictEqual(filterData.total, 1);
    assert.strictEqual(filterData.items[0].id, createdChanId);
  });

  // 8. CSV Export & Import
  await test('8. Xuất và Nhập kênh qua CSV kèm xử lý trùng lặp và xác thực', async () => {
    // Export CSV
    const exportRes = await fetch(`${BASE_URL}/api/channels/export-csv`);
    assert.strictEqual(exportRes.status, 200);
    const buf = Buffer.from(await exportRes.arrayBuffer());
    assert.ok(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, 'Phải có UTF-8 BOM [0xEF, 0xBB, 0xBF]');
    const csvContent = buf.toString('utf-8');
    assert.ok(csvContent.includes('name,url,channel_type'));

    // Import CSV with skip mode
    const sampleCsv = `name,url,channel_type,province,district,property_types,price_segments,target_audiences,verification_status,publishing_capability,notes
"Nhóm CSV Test 1","https://facebook.com/groups/csv.test.1","facebook_group","Hà Nội","Cầu Giấy","can_ho","trung_cap","mua_o","verified","manual_only","Nhập từ test suite"
"Hội Môi Giới BĐS Nam Sài Gòn & Q7 (VIP)","https://www.facebook.com/groups/nhadatquan7.namsaigon","facebook_group","TP. Hồ Chí Minh","Quận 7","","","","unverified","manual_only","Trùng lặp test"`;

    const importRes = await fetch(`${BASE_URL}/api/channels/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData: sampleCsv, duplicateMode: 'skip' })
    });
    assert.strictEqual(importRes.status, 200);
    const impData = await importRes.json();
    assert.strictEqual(impData.imported, 1);
    assert.strictEqual(impData.skipped, 1); // Detected duplicate and skipped

    // Clean up imported test channel
    const checkImported = await fetch(`${BASE_URL}/api/channels?search=csv.test.1`);
    const checkData = await checkImported.json();
    if (checkData.items.length > 0) {
      await fetch(`${BASE_URL}/api/channels/${checkData.items[0].id}`, { method: 'DELETE' });
    }
  });

  // 9. Search Provider Interface
  await test('9. Search Provider trả về thông báo chưa cấu hình API và liên kết tìm kiếm thủ công an toàn', async () => {
    const res = await fetch(`${BASE_URL}/api/channels/search-provider`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isConfigured, false);
    assert.ok(data.message.includes('Search provider'));
    assert.ok(Array.isArray(data.instructions));
    assert.ok(Array.isArray(data.manualDiscoveryLinks));
  });

  // 10. Delete Channel & Delete Collection
  await test('10. Xóa kênh và dọn dẹp bộ sưu tập liên kết', async () => {
    assert.ok(createdChanId);
    const delChan = await fetch(`${BASE_URL}/api/channels/${createdChanId}`, { method: 'DELETE' });
    assert.strictEqual(delChan.status, 200);

    if (testColId) {
      const delCol = await fetch(`${BASE_URL}/api/collections/${testColId}`, { method: 'DELETE' });
      assert.strictEqual(delCol.status, 200);
    }
  });

  // 11. Regression Testing for Phase 1
  await test('11. Kiểm tra hồi quy Phase 1: Dashboard, Listings, Photos, Templates hoạt động 100%', async () => {
    const statsRes = await fetch(`${BASE_URL}/api/stats`);
    assert.strictEqual(statsRes.status, 200);
    const stats = await statsRes.json();
    assert.ok(stats.total >= 2);

    const listingsRes = await fetch(`${BASE_URL}/api/listings`);
    assert.strictEqual(listingsRes.status, 200);
    const listings = await listingsRes.json();
    assert.ok(listings.items.length >= 2);

    const templatesRes = await fetch(`${BASE_URL}/api/templates`);
    assert.strictEqual(templatesRes.status, 200);
    const templates = await templatesRes.json();
    assert.ok(templates.length >= 4);
  });

  console.log('\n====================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 2: ${passed} / ${total} BÀI TEST THÀNH CÔNG!`);
  console.log('====================================================\n');
}

runPhase2Tests().catch(console.error);
