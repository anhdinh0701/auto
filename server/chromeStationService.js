const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

class ChromeStationService {
  constructor() {
    const defaultDataDir = path.resolve(__dirname, '../data/chrome_profile');
    this.userDataDir = process.env.CHROME_USER_DATA_DIR || defaultDataDir;
    this.debugPort = 9222;
    this.endpointUrl = `http://127.0.0.1:${this.debugPort}/json/version`;
    this.activeContext = null;
  }

  /**
   * Tự động dò tìm file chrome.exe chuẩn trên Windows theo thứ tự ưu tiên
   */
  getChromePath() {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];

    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) {
        return candidate;
      }
    }

    throw new Error('Không tìm thấy trình duyệt Google Chrome trên máy tính Windows. Vui lòng kiểm tra lại cài đặt Chrome.');
  }

  /**
   * Kiểm tra xem phiên Facebook trên Trạm Chrome đã đăng nhập (có cookie c_user) chưa
   */
  async isFacebookLoggedIn() {
    try {
      const browser = await chromium.connectOverCDP(this.endpointUrl);
      const context = browser.contexts()[0];
      if (!context) return false;
      const cookies = await context.cookies(['https://www.facebook.com']);
      return cookies.some(c => c.name === 'c_user');
    } catch (_) {
      return false;
    }
  }

  /**
   * Đưa tab Facebook của Trạm Chrome lên màn hình trước mắt người dùng để đăng nhập
   */
  async openFacebookTab() {
    // 1. Kiểm tra trạng thái trạm
    let status = await this.checkStatus();
    if (!status.connected) {
      await this.launchStation();
      status = await this.checkStatus();
    }

    try {
      const browser = await chromium.connectOverCDP(this.endpointUrl);
      const context = browser.contexts()[0] || await browser.newContext();
      const pages = context.pages();
      let fbPage = pages.find(p => p.url().includes('facebook.com'));
      if (!fbPage) {
        fbPage = await context.newPage();
        await fbPage.goto('https://www.facebook.com', { waitUntil: 'domcontentloaded' });
      }
      await fbPage.bringToFront();
      return {
        success: true,
        message: 'Đã mở cửa sổ Chrome chứa trang Facebook trên màn hình của bạn!'
      };
    } catch (err) {
      console.error('[ChromeStation] openFacebookTab error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * API GET /api/chrome/status: Kiểm tra trạng thái thời gian thực cổng 9222 qua 127.0.0.1
   */
  async checkStatus() {
    try {
      const res = await fetch(this.endpointUrl, {
        signal: AbortSignal.timeout(2500)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          connected: true,
          isOnline: true,
          browser: data.Browser,
          webSocketDebuggerUrl: data.webSocketDebuggerUrl,
          debugPort: this.debugPort
        };
      }
    } catch (err) {
      // Offline
    }

    return {
      success: true,
      connected: false,
      isOnline: false,
      message: 'Cổng 9222 chưa mở. Vui lòng bật Chrome với --remote-debugging-port=9222.',
      debugPort: this.debugPort
    };
  }

  /**
   * API POST /api/chrome/launch: Mở Google Chrome thật với giao diện đồ họa GUI thật 100%
   */
  async launchStation() {
    // 1. Kiểm tra nếu cổng 9222 đã mở sẵn
    const current = await this.checkStatus();
    if (current.connected) {
      // Nếu đã mở, chỉ cần đưa tab Facebook lên trước
      await this.openFacebookTab();
      return {
        success: true,
        connected: true,
        alreadyRunning: true,
        message: 'Google Chrome đã đang chạy với cổng 9222!',
        browser: current.browser,
        webSocketDebuggerUrl: current.webSocketDebuggerUrl,
        isFbLoggedIn: current.isFbLoggedIn
      };
    }

    // 2. Tạo thư mục C:\bds_chrome_station nếu chưa có
    try {
      if (!fs.existsSync(this.userDataDir)) {
        fs.mkdirSync(this.userDataDir, { recursive: true });
      }
    } catch (dirErr) {
      console.warn(`[ChromeStation] Không thể tạo thư mục ${this.userDataDir}:`, dirErr.message);
    }

    const chromePath = this.getChromePath();

    try {
      // Dùng launchPersistentContext để đảm bảo mở cửa sổ GUI thật 100% hiển thị trên màn hình máy tính Windows
      this.activeContext = await chromium.launchPersistentContext(this.userDataDir, {
        headless: false,
        executablePath: chromePath,
        args: [
          `--remote-debugging-port=${this.debugPort}`,
          '--remote-allow-origins=*',
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized'
        ],
        viewport: null
      });

      const page = this.activeContext.pages()[0] || await this.activeContext.newPage();
      await page.goto('https://www.facebook.com');
      await page.bringToFront();

      const verifyStatus = await this.checkStatus();
      return {
        success: true,
        connected: true,
        message: 'Đã mở Google Chrome và hiển thị cửa sổ Facebook trên màn hình của bạn!',
        browser: verifyStatus.browser,
        webSocketDebuggerUrl: verifyStatus.webSocketDebuggerUrl,
        isFbLoggedIn: verifyStatus.isFbLoggedIn
      };
    } catch (launchErr) {
      console.error('[ChromeStation] launchPersistentContext error, falling back to spawn:', launchErr.message);
      
      // Fallback: spawn
      const chromeArgs = [
        `--remote-debugging-port=${this.debugPort}`,
        '--remote-allow-origins=*',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        `--user-data-dir=${this.userDataDir}`,
        'https://www.facebook.com'
      ];

      const child = spawn(chromePath, chromeArgs, { detached: true, stdio: 'ignore' });
      child.unref();

      await new Promise(r => setTimeout(r, 3000));
      const verifyStatus = await this.checkStatus();
      if (verifyStatus.connected) {
        return {
          success: true,
          connected: true,
          message: 'Đã mở Google Chrome qua cổng 9222!',
          ...verifyStatus
        };
      }
      throw new Error('Không thể khởi chạy cửa sổ Google Chrome: ' + launchErr.message);
    }
  }
}

module.exports = new ChromeStationService();
