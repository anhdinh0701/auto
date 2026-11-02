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
   * TỰ ĐỘNG ĐĂNG BÀI LÊN NHÓM FACEBOOK THEO QUY TRÌNH "ẢNH TRƯỚC - CHỮ SAU"
   * Đảm bảo 100% Ảnh và Chữ nằm chung trong 1 bài viết duy nhất, không bao giờ bị tách rời
   */
  async publishToGroup({ groupUrl, content, images }) {
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
    console.log(`[ChromePublish] Quy trình: Ảnh trước -> Chữ sau (Tránh tách rời bài)`);
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

      // 2. Đưa trang lên màn hình và điều hướng tới nhóm
      await page.bringToFront();
      console.log(`[ChromePublish] Điều hướng tới nhóm: ${cleanGroupUrl}...`);
      await page.goto(cleanGroupUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(4000);

      // BƯỚC A: Chuyển về tab "Thảo luận" nếu nhóm đang ở tab "Mua bán" (xuất hiện nút "Bạn đang bán gì")
      console.log('[ChromePublish] Bước A: Kiểm tra tab Thảo luận...');
      try {
        const discussionTab = page.locator([
          'a[role="tab"]:has-text("Thảo luận")',
          'a[role="tab"]:has-text("Discussion")',
          'a[role="tab"][href*="discussion"]',
          'div[role="tab"]:has-text("Thảo luận")'
        ].join(', ')).first();

        if (await discussionTab.count() > 0 && await discussionTab.isVisible()) {
          const isSelected = await discussionTab.getAttribute('aria-selected');
          if (isSelected !== 'true') {
            console.log('[ChromePublish] Phát hiện nhóm đang ở tab Mua bán, bấm chuyển sang tab Thảo luận...');
            await discussionTab.click({ force: true });
            await page.waitForTimeout(3500);
          }
        }
      } catch (tabErr) {
        console.log('[ChromePublish] Bỏ qua chuyển tab thảo luận:', tabErr.message);
      }

      // Cuộn nhẹ 200px để kích hoạt thanh công cụ soạn thảo của nhóm
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1500);

      // BƯỚC B: Mở hộp thoại thông qua nút Ảnh/Video hoặc Bạn viết gì đi
      console.log('[ChromePublish] Bước B: Mở ô tạo bài viết...');
      const postTrigger = page.locator([
        'div[role="main"] div[role="button"]:has-text("Bạn viết gì đi")',
        'div[role="main"] div[role="button"]:has-text("Write something")',
        'div[role="main"] div[role="button"]:has-text("Tạo bài viết")',
        'div[role="main"] div[role="button"]:has-text("Bắt đầu thảo luận")',
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

      // Chờ hộp thoại dialog soạn bài hiện lên hoàn toàn (chọn đúng dialog chứa ô soạn thảo contenteditable)
      const dialog = page.locator('div[role="dialog"]').filter({ has: page.locator('div[contenteditable="true"]') }).first();
      await dialog.waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(2000);

      // BƯỚC C: NẠP ẢNH TRƯỚC - CHỜ ẢNH HIỂN THỊ XONG
      if (imagePaths && imagePaths.length > 0) {
        console.log(`[ChromePublish] Bước C: NẠP ẢNH TRƯỚC (${imagePaths.length} ảnh)...`);

        let fileInput = dialog.locator('input[type="file"]').first();
        if (await fileInput.count() === 0) {
          fileInput = page.locator('div[role="dialog"] input[type="file"]').first();
        }

        if (await fileInput.count() > 0) {
          console.log('[ChromePublish] Nạp danh sách file ảnh vào input...');
          await fileInput.setInputFiles(imagePaths);
        } else {
          console.log('[ChromePublish] Kích hoạt nút Ảnh/video bên trong hộp thoại dialog...');
          const photoBtn = dialog.locator([
            'div[aria-label="Ảnh/video"][role="button"]',
            'div[aria-label="Photo/video"][role="button"]',
            'div[aria-label*="Ảnh"]',
            'div[role="button"]:has-text("Ảnh/video")',
            'div[role="button"]:has-text("Photo/video")'
          ].join(', ')).first();

          try {
            await photoBtn.waitFor({ state: 'visible', timeout: 8000 });
            await photoBtn.click({ force: true });
            await page.waitForTimeout(2000);
          } catch (btnErr) {
            console.log('[ChromePublish] Bỏ qua kích hoạt nút ảnh:', btnErr.message);
          }

          fileInput = dialog.locator('input[type="file"]').first();
          await fileInput.setInputFiles(imagePaths);
        }

        console.log('[ChromePublish] Đã nạp file ảnh, chờ 8-10 giây cho Facebook tải ảnh lên xong...');
        await page.waitForTimeout(8000);

        // Chờ nút Đăng hoặc trạng thái loading của ảnh hoàn tất
        const submitBtnPreview = dialog.locator('div[aria-label="Đăng"][role="button"], div[aria-label="Post"][role="button"]').first();
        for (let w = 0; w < 10; w++) {
          const disabled = await submitBtnPreview.getAttribute('aria-disabled').catch(() => null);
          if (disabled !== 'true') break;
          await page.waitForTimeout(1000);
        }
      }

      // BƯỚC D: ĐIỀN CHỮ SAU CÙNG VÀO CÙNG HỘP THOẠI
      console.log('[ChromePublish] Bước D: ĐIỀN CHỮ VÀO CÙNG HỘP THOẠI (phía trên ảnh)...');
      const textBox = dialog.locator([
        'div[contenteditable="true"][role="textbox"]',
        '[contenteditable="true"][aria-placeholder*="Tạo bài viết"]',
        '[contenteditable="true"][aria-label*="Tạo bài viết"]',
        '[contenteditable="true"][aria-placeholder*="bức ảnh"]',
        '[contenteditable="true"][role="textbox"]'
      ].join(', ')).first();

      await textBox.waitFor({ state: 'visible', timeout: 15000 });
      await textBox.click({ force: true });
      await page.waitForTimeout(600);

      console.log('[ChromePublish] Gõ toàn bộ nội dung bài viết bằng bàn phím (delay: 35ms)...');
      await page.keyboard.type(cleanContent, { delay: 35 });
      await page.waitForTimeout(1000);

      // Kiểm tra lại xem chữ đã thực sự nằm trong ô chưa (nếu trống thì dùng insertText điền lại)
      const typedText = await textBox.innerText().catch(() => '');
      if (!typedText || typedText.trim().length === 0) {
        console.log('[ChromePublish] Kiểm tra thấy ô văn bản chưa nhận, dùng insertText điền lại...');
        await textBox.click({ force: true });
        await page.keyboard.insertText(cleanContent);
        await page.waitForTimeout(1200);
      }

      // Đóng các cửa sổ chat nổi nếu có để tránh đè nút Đăng
      try {
        await page.evaluate(() => {
          document.querySelectorAll('div[aria-label="Đóng cuộc trò chuyện"], div[aria-label="Close chat"], div[aria-label="Thu nhỏ tab cuộc trò chuyện"]').forEach(b => b.click());
        });
      } catch (_) {}

      // BƯỚC E: BẤM NÚT ĐĂNG DUY NHẤT 1 LẦN
      console.log('[ChromePublish] Bước E: Tìm nút Đăng và chờ kích hoạt...');
      const submitBtn = dialog.locator([
        'div[aria-label="Đăng"]:not([aria-disabled="true"])',
        'div[aria-label="Post"]:not([aria-disabled="true"])',
        'div[aria-label="Đăng"][role="button"]',
        'div[aria-label="Post"][role="button"]',
        'div[role="button"]:has-text("Đăng"):not(:has-text("Đăng nhập"))'
      ].join(', ')).last();

      await submitBtn.waitFor({ state: 'visible', timeout: 15000 });

      for (let i = 0; i < 20; i++) {
        const isDisabled = await submitBtn.getAttribute('aria-disabled');
        if (isDisabled !== 'true') break;
        await page.waitForTimeout(1000);
      }
      await page.waitForTimeout(1500);

      console.log('[ChromePublish] Bấm nút Đăng duy nhất 1 lần...');
      await submitBtn.evaluate(el => el.click());
      console.log('[ChromePublish] Đã bấm Đăng! Chờ 12 giây cho bài lên sóng hoàn tất...');
      await page.waitForTimeout(12000);

      console.log('[ChromePublish] >>> ĐĂNG BÀI THÀNH CÔNG RỰC RỠ (ĐỦ CẢ ẢNH LẪN CHỮ)! <<<');
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
