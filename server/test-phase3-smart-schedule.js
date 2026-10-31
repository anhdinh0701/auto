/**
 * Comprehensive Verification Test Suite for Phase 3:
 * Group & Time Intelligence + Data Quality & Location + Groq Smart Scheduling
 */

require('dotenv').config();
const assert = require('assert');
const path = require('path');
const db = require('./db');
const smartScheduler = require('./smartScheduler');

async function runPhase3Tests() {
  console.log('\n===============================================================');
  console.log('--- TEST SUITE: GIAI ĐOẠN 3 (GROUP & TIME INTELLIGENCE + GROQ) ---');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Lỗi: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Lỗi: ${err.message}`);
      failed++;
    }
  }

  // ---------------- TEST 1: DATABASE SCHEMA INTEGRITY ----------------
  test('1. Kiểm tra cấu trúc bảng TargetGroups & PostingSchedules', () => {
    const groupCols = db.prepare('PRAGMA table_info(TargetGroups)').all().map(c => c.name);
    const requiredGroupCols = [
      'id', 'group_name', 'group_url', 'target_city', 'target_district',
      'target_property_type', 'active_score', 'approval_latency_minutes',
      'trained_time_slots', 'is_active'
    ];
    for (const col of requiredGroupCols) {
      assert(groupCols.includes(col), `Bảng TargetGroups phải có cột "${col}"`);
    }

    const schedCols = db.prepare('PRAGMA table_info(PostingSchedules)').all().map(c => c.name);
    const requiredSchedCols = [
      'id', 'property_id', 'group_id', 'selected_media_ids', 'scheduled_time',
      'target_time_slot', 'jitter_offset_minutes', 'opening_hook', 'spun_content',
      'status'
    ];
    for (const col of requiredSchedCols) {
      assert(schedCols.includes(col), `Bảng PostingSchedules phải có cột "${col}"`);
    }
  });

  // ---------------- TEST 2: SEED GROUPS & TIME SLOTS INTEGRITY ----------------
  test('2. Kiểm tra dữ liệu nhóm Facebook và khung giờ đã train (TargetGroups)', () => {
    const groups = db.prepare('SELECT * FROM TargetGroups').all();
    assert(groups.length >= 5, `Phải có ít nhất 5 nhóm Facebook trong CSDL (Hiện có: ${groups.length})`);

    const hanoiGroup = groups.find(g => (g.target_city || '').toLowerCase().includes('hà nội'));
    assert(hanoiGroup, 'Phải có ít nhất 1 nhóm tại Hà Nội');

    const slots = typeof hanoiGroup.trained_time_slots === 'string'
      ? JSON.parse(hanoiGroup.trained_time_slots)
      : hanoiGroup.trained_time_slots;
    assert(Array.isArray(slots) && slots.length > 0, 'trained_time_slots phải là mảng các khung giờ vàng');
    assert(slots.includes('19:30'), 'trained_time_slots phải có khung giờ vàng 19:30');
  });

  // ---------------- TEST 3: HARD-CHECK GEOGRAPHICAL ISOLATION ----------------
  test('3. Đối chiếu địa lý cứng (Hard-check): 100% chặn nhóm TP.HCM đối với BĐS Khai Sơn City (Hà Nội)', () => {
    const result = smartScheduler.filterValidGroupsForProperty('sample-listing-1');
    assert(result.property, 'Phải tìm thấy thông tin BĐS Khai Sơn City');
    assert.strictEqual(result.property.city, 'Hà Nội', 'BĐS mẫu phải có city = Hà Nội');

    // All valid groups must be in Hanoi
    for (const vg of result.validGroups) {
      const cityClean = vg.target_city.trim().toLowerCase();
      assert(cityClean.includes('hà nội'), `Nhóm hợp lệ "${vg.group_name}" phải thuộc Hà Nội (Nhận: ${vg.target_city})`);
      assert(vg.active_score >= 5.0, `Nhóm hợp lệ "${vg.group_name}" phải có điểm active_score >= 5.0`);
      assert(vg.is_active === 1 || vg.is_active === null, `Nhóm hợp lệ "${vg.group_name}" phải có is_active = 1`);
    }

    // All HCM groups must be in rejectedGroups
    const rejectedHcm = result.rejectedGroups.filter(rg => (rg.target_city || '').toLowerCase().includes('hồ chí minh'));
    assert(rejectedHcm.length > 0, 'Các nhóm TP.HCM phải bị từ chối tuyệt đối khi đăng tin Hà Nội');
    for (const rg of rejectedHcm) {
      assert(rg.reason.includes('Sai lệch địa lý'), `Lý do từ chối phải ghi rõ sai lệch địa lý: ${rg.reason}`);
    }
  });

  // ---------------- TEST 4: HARD-CHECK FOR INACTIVE OR LOW SCORE GROUPS ----------------
  test('4. Bộ lọc Hard-check tự động loại trừ nhóm bị tắt (is_active = 0) hoặc điểm thấp (< 5.0)', () => {
    // Insert a temporary dummy group with is_active = 0
    const dummyId = `temp-test-grp-${Date.now()}`;
    db.prepare(`
      INSERT INTO TargetGroups (id, group_name, group_url, target_city, active_score, approval_latency_minutes, trained_time_slots, is_active)
      VALUES (?, 'Nhóm Test Inactive Hà Nội', 'https://facebook.com/groups/temp', 'Hà Nội', 9.0, 15, '["19:30"]', 0)
    `).run(dummyId);

    try {
      const result = smartScheduler.filterValidGroupsForProperty('sample-listing-1');
      const foundInValid = result.validGroups.find(g => g.id === dummyId);
      assert(!foundInValid, 'Nhóm có is_active = 0 không được phép lọt vào danh sách hợp lệ');

      const foundInRejected = result.rejectedGroups.find(g => g.id === dummyId);
      assert(foundInRejected, 'Nhóm có is_active = 0 phải nằm trong rejectedGroups');
      assert(foundInRejected.reason.includes('vô hiệu hóa'), 'Lý do phải ghi rõ nhóm bị vô hiệu hóa');
    } finally {
      // Clean up
      db.prepare('DELETE FROM TargetGroups WHERE id = ?').run(dummyId);
    }
  });

  // ---------------- TEST 5: GROQ AI SCHEDULING & CONFLICT JITTER ----------------
  await testAsync('5. Groq AI xếp lịch thông minh & Chống xung đột khung giờ vàng (Jitter 6-12 phút)', async () => {
    const plan = await smartScheduler.generateSmartSchedulePlan('sample-listing-1');
    assert(plan.success, 'Quá trình lên lịch thông minh qua Groq phải thành công');
    assert(plan.schedules.length >= 2, `Phải tạo lịch cho ít nhất 2 nhóm phù hợp (Tạo được: ${plan.schedules.length})`);

    // Verify time conflict resolution / jitter
    // If multiple groups share 19:30, they must NOT trigger at the exact same minute
    const triggerTimes = plan.schedules.map(s => new Date(s.scheduled_time).getTime());
    for (let i = 1; i < triggerTimes.length; i++) {
      const diffMinutes = Math.abs(triggerTimes[i] - triggerTimes[i - 1]) / (60 * 1000);
      // If same slot was targeted, verify there is at least a 6-minute gap
      if (plan.schedules[i].trained_time_slot === plan.schedules[i - 1].trained_time_slot) {
        assert(
          diffMinutes >= 6,
          `Hai nhóm cùng khung giờ vàng (${plan.schedules[i].trained_time_slot}) phải lệch nhau ít nhất 6 phút! (Thực tế lệch: ${diffMinutes.toFixed(1)} phút)`
        );
      }
    }

    // Verify at least one schedule has positive jitter offset applied
    const hasJitter = plan.schedules.some(s => s.jitter_offset_minutes >= 6 && s.jitter_offset_minutes <= 12);
    assert(hasJitter, 'Thuật toán phải áp dụng Random Jitter từ 6 đến 12 phút khi có xung đột khung giờ');
  });

  // ---------------- TEST 6: MICRO-SPINNING & 100% SPEC PRESERVATION ----------------
  await testAsync('6. Micro-Spinning: Biến tấu câu mở đầu, giữ nguyên 100% thông số BĐS', async () => {
    const plan = await smartScheduler.generateSmartSchedulePlan('sample-listing-1');
    const property = db.prepare('SELECT * FROM Properties WHERE id = ?').get('sample-listing-1');

    const hooks = new Set();
    for (const item of plan.schedules) {
      assert(item.opening_hook && item.opening_hook.length > 10, 'Opening hook phải có nội dung');
      hooks.add(item.opening_hook);

      // Verify underlying specs are 100% preserved in spun_content
      assert(item.spun_content.includes('Khai Sơn City'), 'Nội dung bài viết phải giữ nguyên tên dự án Khai Sơn City');
      assert(item.spun_content.includes('69m2') || item.spun_content.includes('69 m2') || item.spun_content.includes('69'), 'Nội dung bài viết phải giữ nguyên diện tích');
      assert(item.spun_content.includes('2.85 tỷ') || item.spun_content.includes('2.85'), 'Nội dung bài viết phải giữ nguyên giá bán 2.85 tỷ');
      assert(item.spun_content.includes('sổ hồng'), 'Nội dung bài viết phải giữ nguyên thông tin pháp lý');
    }

    // Check hook diversity
    assert(hooks.size >= 2, 'Các nhóm khác nhau phải có opening hook biến tấu khác nhau');
  });

  // ---------------- TEST 7: DATABASE PERSISTENCE STATUS = 'Pending' ----------------
  test('7. Lưu trạng thái lịch đăng PostingSchedules = "Pending" và tạo publishing_tasks', () => {
    const pendingSchedules = db.prepare(`
      SELECT * FROM PostingSchedules 
      WHERE property_id = 'sample-listing-1' AND status = 'Pending'
      ORDER BY created_at DESC
    `).all();
    assert(pendingSchedules.length > 0, 'Phải có các bản ghi PostingSchedules ở trạng thái Pending');

    // Find a schedule generated by the Phase 3 scheduler
    const phase3Sched = pendingSchedules.find(s => s.id.startsWith('sched-'));
    assert(phase3Sched, 'Phải tìm thấy lịch đăng do SmartScheduler tạo (tiền tố sched-)');
    assert(phase3Sched.scheduled_time, 'Lịch đăng phải có scheduled_time');
    assert(phase3Sched.opening_hook, 'Lịch đăng phải có opening_hook');
    assert(phase3Sched.spun_content, 'Lịch đăng phải có spun_content');

    const tasks = db.prepare(`
      SELECT * FROM publishing_tasks 
      WHERE listing_id = 'sample-listing-1' AND status = 'scheduled'
      ORDER BY created_at DESC
    `).all();
    assert(tasks.length > 0, 'Phải tạo các publishing_tasks ở trạng thái scheduled cho worker');
  });

  // ---------------- TEST 8: REST API ENDPOINTS ----------------
  await testAsync('8. Kiểm tra toàn bộ REST API Giai đoạn 3 qua HTTP fetch (Port 3001)', async () => {
    // 1. GET target-groups
    const resGroups = await fetch('http://localhost:3001/api/intelligence/target-groups');
    assert.strictEqual(resGroups.status, 200, 'GET /api/intelligence/target-groups phải trả về HTTP 200');
    const jsonGroups = await resGroups.json();
    assert(jsonGroups.success, 'API target-groups phải trả về success: true');
    assert(Array.isArray(jsonGroups.data), 'API target-groups phải trả về mảng dữ liệu');

    // 2. GET hardcheck
    const resHc = await fetch('http://localhost:3001/api/intelligence/hardcheck/sample-listing-1');
    assert.strictEqual(resHc.status, 200, 'GET /api/intelligence/hardcheck phải trả về HTTP 200');
    const jsonHc = await resHc.json();
    assert(jsonHc.success, 'API hardcheck phải trả về success: true');
    assert(jsonHc.data.validGroups.length > 0, 'Hardcheck API phải trả về validGroups');

    // 3. POST smart-schedule
    const resSched = await fetch('http://localhost:3001/api/intelligence/smart-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: 'sample-listing-1' })
    });
    assert.strictEqual(resSched.status, 200, 'POST /api/intelligence/smart-schedule phải trả về HTTP 200');
    const jsonSched = await resSched.json();
    assert(jsonSched.success, 'Smart-schedule API phải trả về success: true');
    assert(jsonSched.data.schedules_created_count > 0, 'Phải tạo ít nhất 1 lịch đăng');

    // 4. GET posting-schedules
    const resPosting = await fetch('http://localhost:3001/api/posting-schedules');
    assert.strictEqual(resPosting.status, 200, 'GET /api/posting-schedules phải trả về HTTP 200');
    const jsonPosting = await resPosting.json();
    assert(jsonPosting.success, 'API posting-schedules phải trả về success: true');
    assert(jsonPosting.data.length > 0, 'Posting-schedules phải có dữ liệu');
  });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ TEST GIAI ĐOẠN 3: ${passed} PASSED / ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('Lỗi thực thi test suite:', err);
  process.exit(1);
});
