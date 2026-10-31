const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

let globalContext = null;

/**
 * Lấy Browser Session: Ưu tiên số 1 kết nối qua Port 9222 (CDP), nếu không có thì dùng Singleton Persistent Context
 */
async function getBrowserSession() {
  // 1. Ưu tiên số 1: Kết nối trực tiếp vào Chrome Laptop đang mở ở Port 9222
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data.webSocketDebuggerUrl) {
        console.log('[ChromePublish] Kết nối thành công vào Chrome Laptop (Port 9222):', data.webSocketDebuggerUrl);
        const cdpBrowser = await chromium.connectOverCDP(data.webSocketDebuggerUrl);
        const cdpContext = cdpBrowser.contexts()[0] || (await cdpBrowser.newContext());
        return { context: cdpContext, browser: cdpBrowser, isCDP: true };
      }
    }
  } catch (cdpErr) {
    console.log('[ChromePublish] Port 9222 chưa phản hồi:', cdpErr.message);
  }

  // 2. Dự phòng: Singleton Persistent Context (C:\bds_playwright_visible)
  if (!globalContext || !globalContext.browser()?.isConnected()) {
    console.log('[ChromePublish] Khởi động Google Chrome Singleton (C:\\bds_playwright_visible)...');
    globalContext = await chromium.launchPersistentContext('C:\\bds_playwright_visible', {
      headless: false,
      channel: 'chrome',
      viewport: null,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    globalContext.on('close', () => {
      console.log('[ChromePublish] Cửa sổ Chrome Singleton đã đóng, reset globalContext.');
      globalContext = null;
    });
  }
  return { context: globalContext, browser: globalContext.browser(), isCDP: false };
}

class ChromePublishService {
  constructor() {
    this.uploadsDir = path.resolve(__dirname, '..', 'uploads');
    this.errorLogsDir = path.resolve(__dirname, '..', 'logs', 'errors');
    if (!fs.existsSync(this.errorLogsDir)) {
      fs.mkdirSync(this.errorLogsDir, { recursive: true });
    }
  }

  /**
   * Mở tab Facebook trên cửa sổ Chrome và đưa lên trước màn hình
   */
  async openFacebookTab() {
    const { context } = await getBrowserSession();
    const pages = context.pages();
    let fbPage = pages.find(p => p.url().includes('facebook.com'));
    if (!fbPage) {
      fbPage = await context.newPage();
      await fbPage.goto('https://www.facebook.com');
    }
    await fbPage.bringToFront();
    return {
      success: true,
      message: 'Đã mở cửa sổ Chrome chứa trang Facebook trên màn hình của bạn!'
    };
  }

  /**
   * Kiểm tra trạng thái Chrome
   */
  async checkStatus() {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          connected: true,
          isOnline: true,
          browser: `Google Chrome Laptop Port 9222 (${data.Browser || 'Connected'})`
        };
      }
    } catch (_) {}

    const isOnline = Boolean(globalContext && globalContext.browser()?.isConnected());
    return {
      success: true,
      connected: isOnline,
      isOnline: isOnline,
      browser: 'Google Chrome (C:\\bds_playwright_visible)'
    };
  }

  /**
   * Chuyển đổi tên file hoặc mảng ảnh sang đường dẫn tuyệt đối chuẩn (path.resolve) trên Windows
   */
  resolveAbsoluteImagePaths(images) {
    if (!images) return [];
    const list = Array.isArray(images) ? images : [images];
    const absolutePaths = [];

    for (const item of list) {
      if (!item) continue;
      let targetPath = null;

      if (typeof item === 'string') {
        if (path.isAbsolute(item)) {
          targetPath = item;
        } else {
          const cleanFilename = item.replace(/^\/?uploads[\/\\]/, '');
          targetPath = path.resolve(this.uploadsDir, cleanFilename);
        }
      } else if (item.path) {
        targetPath = item.path;
      } else if (item.filename) {
        targetPath = path.resolve(this.uploadsDir, item.filename);
      }

      if (targetPath && fs.existsSync(targetPath) && !absolutePaths.includes(targetPath)) {
        absolutePaths.push(targetPath);
      }
    }

    return absolutePaths;
  }

  /**
   * Tự động điều khiển Chrome đăng bài lên nhóm (hỗ trợ đăng chéo nhiều nhóm 1 lần nếu có crossPostKeyword)
   */
  async publishToGroup({ groupUrl, content, images, crossPostKeyword = null, maxGroups = 10 }) {
    if (!groupUrl || !groupUrl.trim()) {
      throw new Error('Thiếu đường dẫn Nhóm Facebook (groupUrl).');
    }
    if (!content || !content.trim()) {
      throw new Error('Nội dung bài viết không được để trống.');
    }

    const cleanGroupUrl = groupUrl.trim();
    const cleanContent = content.trim();
    const imagePaths = this.resolveAbsoluteImagePaths(images);

    console.log(`\n======================================================`);
    console.log(`[ChromePublish] BẮT ĐẦU ĐĂNG BÀI LÊN NHÓM FACEBOOK`);
    console.log(`[ChromePublish] Group URL: ${cleanGroupUrl}`);
    console.log(`[ChromePublish] Số ảnh đính kèm: ${imagePaths.length}`);
    if (crossPostKeyword) {
      console.log(`[ChromePublish] Đăng chéo nhóm với từ khóa: "${crossPostKeyword}" (tối đa ${maxGroups} nhóm)`);
    }
    console.log(`======================================================`);

    const { context, isCDP } = await getBrowserSession();
    const page = await context.newPage();

    try {
      // 1. Chỉ kiểm tra cookie nếu chạy ở profile bds_playwright_visible (ở chế độ CDP không chặn)
      if (!isCDP) {
        const fbCookies = await context.cookies(['https://www.facebook.com']);
        const hasFbSession = fbCookies.some(c => c.name === 'c_user');

        if (!hasFbSession) {
          console.log('[ChromePublish] Đưa trang https://www.facebook.com lên trước mắt và chờ đăng nhập (tối đa 120s)...');
          await page.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded' });
          await page.bringToFront();

          const startTime = Date.now();
          let loggedIn = false;
          while (Date.now() - startTime < 120000) {
            await page.waitForTimeout(2000);
            const currentCookies = await context.cookies(['https://www.facebook.com']);
            if (currentCookies.some(c => c.name === 'c_user')) {
              console.log('[ChromePublish] Đã phát hiện đăng nhập Facebook thành công!');
              loggedIn = true;
              break;
            }
          }

          if (!loggedIn) {
            throw new Error('Cửa sổ Chrome chưa đăng nhập Facebook. Bạn hãy đăng nhập tài khoản Facebook trên cửa sổ Chrome vừa mở (trong 120 giây).');
          }
        }
      }

      // 2. Đưa trang lên màn hình và vào nhóm
      await page.bringToFront();
      console.log(`[ChromePublish] Điều hướng tới nhóm: ${cleanGroupUrl}...`);
      await page.goto(cleanGroupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);

      // 3. Cuộn nhẹ 200px để kích hoạt giao diện nhóm
      console.log('[ChromePublish] Cuộn nhẹ 200px để lộ khung đăng bài của nhóm...');
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1500);

      // 4. Tìm ô mở khung viết bài đa tầng
      console.log('[ChromePublish] Mở ô tạo bài viết...');
      const postTrigger = page.locator([
        'div[role="main"] div[role="button"]:has-text("Bạn viết gì đi")',
        'div[role="main"] div[role="button"]:has-text("Write something")',
        'div[role="main"] div[role="button"]:has-text("Tạo bài viết")',
        'div[role="main"] div[role="button"]:has-text("Bắt đầu thảo luận")',
        'div[role="main"] div[role="button"]:has-text("Bạn đang bán gì")',
        'div[role="main"] div[role="button"]:has-text("Hãy viết gì đó")',
        'div[role="main"] div[role="button"]:has-text("Ảnh/video")',
        'div[role="main"] span:has-text("Bạn viết gì đi")',
        'div[role="main"] span:has-text("Write something")',
        'div[role="feed"] div[role="button"]:has-text("Bạn viết gì đi")',
        'div[role="button"]:has-text("Bạn viết gì đi")',
        'div[role="button"]:has-text("Write something")'
      ].join(', ')).first();

      try {
        await postTrigger.waitFor({ state: 'visible', timeout: 15000 });
        await postTrigger.scrollIntoViewIfNeeded();
        await postTrigger.click({ force: true });
      } catch (triggerErr) {
        console.log('[ChromePublish] Thử tìm nút tạo bài viết bằng bộ lọc phụ:', triggerErr.message);
        const fallbackTrigger = page.locator('div[role="main"] div[role="button"]').filter({
          hasText: /Bạn viết gì đi|Write something|Tạo bài viết|Bắt đầu thảo luận|Ảnh\/video/i
        }).first();
        await fallbackTrigger.scrollIntoViewIfNeeded();
        await fallbackTrigger.click({ force: true });
      }

      await page.waitForTimeout(2500);

      // 5. Nếu có ảnh: Kích hoạt icon Ảnh/video trong dialog rồi nạp file
      if (imagePaths && imagePaths.length > 0) {
        console.log(`[ChromePublish] Mở khu vực ảnh và nạp ${imagePaths.length} ảnh đính kèm...`);
        try {
          const photoBtn = page.locator('div[role="dialog"] div[aria-label="Ảnh/video"], div[aria-label="Ảnh/video"]').first();
          await photoBtn.click({ force: true });
          await page.waitForTimeout(2000);
        } catch (photoBtnErr) {
          console.log('[ChromePublish] Nút Ảnh/video mở sẵn hoặc bỏ qua:', photoBtnErr.message);
        }

        const fileInput = page.locator('div[role="dialog"] input[type="file"], input[type="file"]').last();
        await fileInput.setInputFiles(imagePaths);
        console.log('[ChromePublish] Đã nạp file ảnh, chờ 7 giây cho Facebook render ảnh...');
        await page.waitForTimeout(7000);
      }

      // 6. Nhập nội dung bài viết vào ô soạn thảo
      console.log('[ChromePublish] Điền nội dung bài viết vào hộp thoại...');
      const textBox = page.locator([
        'div[role="dialog"] [contenteditable="true"][role="textbox"]',
        '[contenteditable="true"][aria-placeholder*="Tạo bài viết"]',
        '[contenteditable="true"][aria-label*="Tạo bài viết"]',
        '[contenteditable="true"][aria-placeholder*="bức ảnh"]',
        '[contenteditable="true"][role="textbox"]'
      ].join(', ')).first();

      await textBox.waitFor({ state: 'visible', timeout: 15000 });
      await textBox.click({ force: true });
      await page.waitForTimeout(500);
      await page.keyboard.insertText(cleanContent);
      await page.waitForTimeout(2000);

      // 7. Chọn thêm các nhóm khác (đăng chéo lên đến 10 nhóm cùng lúc nếu có yêu cầu)
      if (crossPostKeyword) {
        try {
          console.log(`[ChromePublish] Đang tìm nút "+ Thêm nhóm" để chọn các nhóm có từ khóa "${crossPostKeyword}"...`);
          const addGroupsBtn = page.locator('div[role="dialog"] div[role="button"]:has-text("Thêm nhóm"), div[role="dialog"] span:has-text("Thêm nhóm")').first();
          if (await addGroupsBtn.count() > 0 && await addGroupsBtn.isVisible()) {
            await addGroupsBtn.click({ force: true });
            await page.waitForTimeout(2500);

            const searchInput = page.locator('input[placeholder="Tìm kiếm nhóm"], input[placeholder*="Tìm kiếm nhóm"]').first();
            if (await searchInput.count() > 0) {
              await searchInput.click({ force: true });
              await page.keyboard.insertText(crossPostKeyword);
              await page.waitForTimeout(2500);

              const rows = page.locator('div[role="dialog"] div[role="button"]').filter({ hasText: new RegExp(crossPostKeyword, 'i') });
              const rowCount = await rows.count();
              console.log(`[ChromePublish] Tìm thấy ${rowCount} nhóm có từ khóa "${crossPostKeyword}"!`);
              const selectLimit = Math.min(rowCount, Math.max(1, maxGroups - 1));
              for (let i = 0; i < selectLimit; i++) {
                await rows.nth(i).click({ force: true });
                await page.waitForTimeout(400);
              }

              const doneBtn = page.locator('div[aria-label="Xong"], div[role="button"]:has-text("Xong")').last();
              await doneBtn.click({ force: true });
              await page.waitForTimeout(2500);
            }
          }
        } catch (crossPostErr) {
          console.log('[ChromePublish] Bỏ qua thêm nhóm:', crossPostErr.message);
        }
      }

      // 8. Bấm nút Đăng bài
      console.log('[ChromePublish] Tìm nút Đăng và chờ kích hoạt...');
      const submitBtn = page.locator('div[aria-label="Đăng"][role="button"], div[role="button"]:has-text("Đăng"):not(:has-text("Đăng nhập"))').last();
      await submitBtn.waitFor({ state: 'visible', timeout: 15000 });

      for (let i = 0; i < 20; i++) {
        const isDisabled = await submitBtn.getAttribute('aria-disabled');
        if (isDisabled !== 'true') break;
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(1500);

      console.log('[ChromePublish] Bấm nút Đăng bài...');
      await submitBtn.evaluate(el => el.click());
      console.log('[ChromePublish] Đã bấm nút Đăng! Chờ 15 giây hoàn tất...');
      await page.waitForTimeout(15000);

      console.log('[ChromePublish] >>> ĐĂNG BÀI THÀNH CÔNG! <<<');
      return {
        success: true,
        groupUrl: cleanGroupUrl,
        imageCount: imagePaths.length,
        message: 'Đã đăng bài thành công lên nhóm Facebook trên cửa sổ Chrome của bạn!'
      };

    } catch (err) {
      console.error('[ChromePublish] LỖI THỰC THI:', err.message);

      let errorScreenshotUrl = null;
      if (page) {
        try {
          const errFileName = `error-publish-${Date.now()}.png`;
          const errPath = path.resolve(this.errorLogsDir, errFileName);
          await page.screenshot({ path: errPath, fullPage: true });
          errorScreenshotUrl = `/logs/errors/${errFileName}`;
          console.log(`[ChromePublish] Đã lưu ảnh chụp lỗi: ${errPath}`);
        } catch (_) {}
      }

      const enhancedError = new Error(err.message);
      enhancedError.screenshotUrl = errorScreenshotUrl;
      throw enhancedError;

    } finally {
      if (page) {
        try {
          console.log('[ChromePublish] Đóng tab đăng bài (page.close), giữ cửa sổ Chrome luôn mở.');
          await page.close();
        } catch (_) {}
      }
    }
  }
}

module.exports = new ChromePublishService();
module.exports.getBrowserSession = getBrowserSession;
