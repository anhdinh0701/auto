/**
 * Comprehensive Verification Test Suite for Phase 4:
 * Local Chrome Station 24/24 + Dedicated Posting Agent
 */

require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const chromeStationService = require('./chromeStationService');
const dedicatedPostingAgent = require('./dedicatedPostingAgent');
const { chromium } = require('playwright');

async function runPhase4Tests() {
  console.log('\n===============================================================');
  console.log('--- TEST SUITE: GIAI ĐOẠN 4 (LOCAL CHROME STATION 24/24 & AGENT) ---');
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

  // ---------------- TEST 1: CHROME STATION CONFIG & EXECUTABLE ----------------
  test('1. Kiểm tra đường dẫn Google Chrome thật trên Windows & Thư mục C:\\bds_chrome_station', () => {
    const chromePath = chromeStationService.getChromePath();
    assert(chromePath && fs.existsSync(chromePath), `Google Chrome phải tồn tại trên máy tính Windows (${chromePath})`);
    assert(fs.existsSync('C:\\bds_chrome_station'), 'Thư mục hồ sơ C:\\bds_chrome_station phải được tạo');
  });

  // ---------------- TEST 2: CHROME STATION STATUS ONLINE & CDP 9222 ----------------
  await testAsync('2. Kiểm tra Trạm Chrome 24/24 phản hồi ONLINE qua IP 127.0.0.1:9222', async () => {
    const status = await chromeStationService.checkStatus();
    assert(status.isOnline, 'Trạm Chrome 24/24 phải đang ONLINE');
    assert(status.webSocketDebuggerUrl, 'Trạm Chrome phải trả về webSocketDebuggerUrl hợp lệ');
    assert.strictEqual(status.status, 'ONLINE', 'Trạng thái trạm phải là ONLINE');
    assert(status.browser.includes('Chrome'), `Trình duyệt phải là Chrome thật (Nhận: ${status.browser})`);
  });

  // ---------------- TEST 3: PLAYWRIGHT CDP CONNECTION OVER PORT 9222 ----------------
  await testAsync('3. Playwright kết nối thành công qua CDP (chromium.connectOverCDP) và điều khiển tab', async () => {
    const status = await chromeStationService.checkStatus();
    const browser = await chromium.connectOverCDP(status.webSocketDebuggerUrl);
    assert(browser.isConnected(), 'Playwright phải kết nối được với Trạm Chrome qua CDP');

    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();
    await page.goto('about:blank');
    const url = page.url();
    assert.strictEqual(url, 'about:blank', 'Trang mới phải mở tại about:blank');

    // Test 24/24 rule: Only close the page, NEVER close the browser
    await page.close();
    assert(browser.isConnected(), 'Sau khi page.close(), browser vẫn phải duy trì kết nối bền vững 24/24');
  });

  // ---------------- TEST 4: IMAGE RESOLUTION FOR POSTING AGENT ----------------
  test('4. Dedicated Posting Agent trích xuất đường dẫn tuyệt đối cho bộ ảnh AI đã duyệt', () => {
    // Pick or create test schedule
    const schedule = db.prepare(`
      SELECT * FROM PostingSchedules 
      WHERE property_id = 'sample-listing-1' 
      ORDER BY created_at DESC LIMIT 1
    `).get();

    assert(schedule, 'Phải có ít nhất 1 lịch đăng trong PostingSchedules để test');
    const imagePaths = dedicatedPostingAgent.resolveImagePaths(schedule);
    assert(Array.isArray(imagePaths), 'resolveImagePaths phải trả về một mảng');
    assert(imagePaths.length > 0, `Phải phân giải được ít nhất 1 ảnh thực tế (Tìm được: ${imagePaths.length})`);

    for (const p of imagePaths) {
      assert(path.isAbsolute(p), `Đường dẫn ảnh phải là tuyệt đối: ${p}`);
      assert(fs.existsSync(p), `Tệp ảnh phải tồn tại thực tế trên ổ cứng: ${p}`);
    }
  });

  // ---------------- TEST 5: SELF-HEALING & ERROR SCREENSHOT CAPTURE ----------------
  await testAsync('5. Cơ chế Tự phục hồi (Self-Healing) & Chụp ảnh lỗi lưu tại ./logs/errors/', async () => {
    // Create an invalid dummy schedule to trigger error handling
    const dummyScheduleId = `sched-test-fail-${Date.now()}`;
    db.prepare(`
      INSERT INTO PostingSchedules (
        id, property_id, group_id, selected_media_ids, scheduled_time,
        target_time_slot, opening_hook, spun_content, status, created_at, updated_at
      ) VALUES (?, 'sample-listing-1', 'fake-group', '[]', datetime('now'), '19:30', 'Test Fail', 'Test Content', 'Pending', datetime('now'), datetime('now'))
    `).run(dummyScheduleId);

    try {
      // Execute post with an invalid URL to test error capture and self-healing
      const fakeSchedule = {
        id: dummyScheduleId,
        group_name: 'Nhóm Giả Định Lỗi',
        group_url: 'https://www.facebook.com/groups/fake.nonexistent.group.1234567890',
        spun_content: 'Test content',
        selected_media_ids: '[]'
      };

      const result = await dedicatedPostingAgent.executePostProcess(fakeSchedule);
      assert.strictEqual(result.success, false, 'Tác vụ với nhóm không tồn tại phải trả về success: false');
      assert.strictEqual(result.status, 'Failed', 'Trạng thái phải cập nhật thành Failed');

      // Check database update
      const updated = db.prepare('SELECT status, error_log FROM PostingSchedules WHERE id = ?').get(dummyScheduleId);
      assert.strictEqual(updated.status, 'Failed', 'Database phải lưu trạng thái Failed');
      assert(updated.error_log, 'Database phải ghi nhận chi tiết error_log');

      // Check error logs directory
      assert(fs.existsSync('./logs/errors'), 'Thư mục ./logs/errors phải tồn tại');
    } finally {
      // Clean up
      db.prepare('DELETE FROM PostingSchedules WHERE id = ?').run(dummyScheduleId);
    }
  });

  // ---------------- TEST 6: CHROME STATION 24/24 REST APIS ----------------
  await testAsync('6. Kiểm tra các REST API của Chrome Station 24/24 (HTTP fetch)', async () => {
    // 1. GET /api/accounts/chrome-station/status
    const resStatus = await fetch('http://localhost:3001/api/accounts/chrome-station/status');
    assert.strictEqual(resStatus.status, 200, 'GET /api/accounts/chrome-station/status phải trả về 200');
    const jsonStatus = await resStatus.json();
    assert.strictEqual(jsonStatus.isOnline, true, 'isOnline phải là true');
    assert.strictEqual(jsonStatus.status, 'ONLINE', 'status phải là ONLINE');
    assert(jsonStatus.webSocketDebuggerUrl, 'webSocketDebuggerUrl phải có giá trị');

    // 2. GET /api/publishing/agent-status
    const resAgent = await fetch('http://localhost:3001/api/publishing/agent-status');
    assert.strictEqual(resAgent.status, 200, 'GET /api/publishing/agent-status phải trả về 200');
    const jsonAgent = await resAgent.json();
    assert.strictEqual(jsonAgent.success, true, 'success phải là true');
    assert.strictEqual(jsonAgent.agent_active, true, 'agent_active phải là true');
    assert(jsonAgent.stats, 'agent stats phải có');
  });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ TEST GIAI ĐOẠN 4: ${passed} PASSED / ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch(err => {
  console.error('Lỗi thực thi test suite Giai đoạn 4:', err);
  process.exit(1);
});
