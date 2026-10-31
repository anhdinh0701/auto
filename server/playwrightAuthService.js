const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const db = require('./db');

class PlaywrightAuthService {
  constructor() {
    this.userDataDir = path.resolve(__dirname, '../data/fb_profiles/default_user');
    this.currentContext = null;
    this.activePage = null;
    this.monitorInterval = null;
    this.browserState = {
      status: 'idle', // 'idle' | 'opening' | 'waiting_for_login' | 'connected' | 'error'
      uid: null,
      isBrowserOpen: false,
      message: 'Chưa mở trình duyệt'
    };

    // Ensure profile dir exists
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  /**
   * Launch persistent context pointing strictly to https://www.facebook.com/
   */
  async launchBrowser() {
    // If browser is already open, bring to front
    if (this.currentContext) {
      try {
        if (this.activePage) {
          await this.activePage.bringToFront();
        }
        return {
          success: true,
          status: this.browserState.status,
          isBrowserOpen: true,
          message: 'Trình duyệt Facebook đang mở. Vui lòng đăng nhập trên cửa sổ đó...'
        };
      } catch (_) {
        this.currentContext = null;
      }
    }

    this.browserState = {
      status: 'opening',
      uid: null,
      isBrowserOpen: true,
      message: 'Đang mở cửa sổ trình duyệt Chromium...'
    };

    try {
      const launchOptions = {
        headless: false,
        viewport: { width: 1280, height: 800 },
        args: [
          '--disable-blink-features=AutomationControlled'
        ]
      };

      if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
        launchOptions.channel = 'chrome';
      } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
        launchOptions.channel = 'msedge';
      }

      console.log(`[PlaywrightAuth] Launching persistent context at: ${this.userDataDir}`);
      this.currentContext = await chromium.launchPersistentContext(this.userDataDir, launchOptions);

      // Handle context close
      this.currentContext.on('close', () => {
        console.log('[PlaywrightAuth] Browser closed by user or system');
        if (this.browserState.status !== 'connected') {
          this.browserState = {
            status: 'idle',
            uid: null,
            isBrowserOpen: false,
            message: 'Trình duyệt đã đóng.'
          };
        }
        this.currentContext = null;
        this.activePage = null;
        if (this.monitorInterval) {
          clearInterval(this.monitorInterval);
          this.monitorInterval = null;
        }
      });

      const pages = this.currentContext.pages();
      this.activePage = pages.length > 0 ? pages[0] : await this.currentContext.newPage();

      // Navigate STRICTLY to https://www.facebook.com/ (no app_id or oauth query params!)
      console.log('[PlaywrightAuth] Navigating strictly to https://www.facebook.com/');
      await this.activePage.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

      this.browserState = {
        status: 'waiting_for_login',
        uid: null,
        isBrowserOpen: true,
        message: 'Trình duyệt đang mở tại https://www.facebook.com/. Vui lòng đăng nhập tài khoản của bạn...'
      };

      // Start active cookie monitor (every 2 seconds)
      this.startCookieMonitor(this.currentContext);

      return {
        success: true,
        status: 'waiting_for_login',
        isBrowserOpen: true,
        message: 'Đã mở trình duyệt Facebook thành công. Hãy đăng nhập tài khoản của bạn trên cửa sổ trình duyệt.'
      };
    } catch (err) {
      console.error('[PlaywrightAuth] Failed to launch browser:', err);
      this.browserState = {
        status: 'error',
        uid: null,
        isBrowserOpen: false,
        message: 'Lỗi mở trình duyệt: ' + err.message
      };
      throw err;
    }
  }

  /**
   * Check and verify cookies in a context
   */
  async verifyAndSaveCookies(context) {
    if (!context) return { isConnected: false };

    try {
      const cookies = await context.cookies(['https://www.facebook.com', 'https://facebook.com']);
      const cUserCookie = cookies.find(c => c.name === 'c_user');

      if (cUserCookie && cUserCookie.value) {
        const uid = String(cUserCookie.value).trim();
        console.log(`[PlaywrightAuth] >>> Found c_user cookie! UID = ${uid} <<<`);

        // 1. Save to Database as Connected
        this.saveConnectedAccount(uid, cookies);

        // 2. Update internal state
        this.browserState = {
          status: 'connected',
          uid,
          isBrowserOpen: false,
          message: `Đã kết nối thành công tài khoản Facebook (UID: ${uid})!`
        };

        // 3. Clear interval
        if (this.monitorInterval) {
          clearInterval(this.monitorInterval);
          this.monitorInterval = null;
        }

        // 4. Close the browser automatically
        try {
          await context.close();
        } catch (_) {}
        this.currentContext = null;
        this.activePage = null;

        return { isConnected: true, uid };
      }
    } catch (err) {
      if (err.message && (err.message.includes('closed') || err.message.includes('Target page'))) {
        if (this.monitorInterval) {
          clearInterval(this.monitorInterval);
          this.monitorInterval = null;
        }
        this.currentContext = null;
        this.activePage = null;
      }
    }

    return { isConnected: false };
  }

  /**
   * Monitor context.cookies() periodically every 2 seconds for c_user
   */
  startCookieMonitor(context) {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      if (!this.currentContext || this.currentContext !== context) {
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
        return;
      }

      await this.verifyAndSaveCookies(context);
    }, 2000);
  }

  /**
   * Immediate cookie check triggered by "Đã đăng nhập xong - Kiểm tra ngay" button
   */
  async checkCookiesNow() {
    if (!this.currentContext) {
      // Check if an existing connected account is already in DB
      const existing = db.prepare(`
        SELECT * FROM account_sessions 
        WHERE platform = 'facebook_page' AND connection_status = 'CONNECTED'
        ORDER BY updated_at DESC LIMIT 1
      `).get();

      if (existing) {
        return {
          success: true,
          isConnected: true,
          uid: existing.account_id,
          message: `Tài khoản ${existing.connection_name} đã ở trạng thái Connected.`
        };
      }

      return {
        success: false,
        isConnected: false,
        message: 'Trình duyệt chưa được mở. Vui lòng bấm "Mở trình duyệt" trước.'
      };
    }

    const result = await this.verifyAndSaveCookies(this.currentContext);
    if (result.isConnected) {
      return {
        success: true,
        isConnected: true,
        uid: result.uid,
        message: `Đã tìm thấy cookie c_user! Kết nối thành công tài khoản UID: ${result.uid}.`
      };
    }

    return {
      success: true,
      isConnected: false,
      message: 'Chưa phát hiện cookie c_user trên Facebook. Vui lòng hoàn tất đăng nhập trên cửa sổ trình duyệt rồi thử lại.'
    };
  }

  /**
   * Import raw cookie string or JSON array from textarea
   */
  async importRawCookie(cookieString) {
    if (!cookieString || typeof cookieString !== 'string') {
      return { success: false, error: 'Chuỗi cookie không được để trống.' };
    }

    let cookies = [];
    let uid = null;

    const trimmed = cookieString.trim();

    // Support JSON array format
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          cookies = parsed.map(c => ({
            name: c.name || c.key,
            value: c.value,
            domain: c.domain || '.facebook.com',
            path: c.path || '/'
          }));
          const cUser = cookies.find(c => c.name === 'c_user');
          if (cUser && cUser.value) {
            uid = String(cUser.value).trim();
          }
        }
      } catch (_) {}
    }

    // Support standard key=value; key2=val2 string format
    if (cookies.length === 0) {
      const parts = trimmed.split(';').map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
          const name = part.slice(0, eqIdx).trim();
          const value = part.slice(eqIdx + 1).trim();
          if (name === 'c_user') {
            uid = value;
          }
          cookies.push({
            name,
            value,
            domain: '.facebook.com',
            path: '/'
          });
        }
      }
    }

    if (!uid) {
      return {
        success: false,
        error: 'Không tìm thấy cookie c_user (UID tài khoản) trong chuỗi bạn vừa dán. Vui lòng đảm bảo chuỗi cookie có chứa c_user=...;'
      };
    }

    console.log(`[PlaywrightAuth] Importing raw cookies for UID: ${uid} (${cookies.length} cookies)`);

    // If context is currently open, inject cookies and close
    if (this.currentContext) {
      try {
        await this.currentContext.addCookies(cookies);
      } catch (err) {
        console.warn('[PlaywrightAuth] Failed to inject cookies into open context:', err.message);
      }
      try {
        await this.currentContext.close();
      } catch (_) {}
      this.currentContext = null;
      this.activePage = null;
    }

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    // Save to Database
    this.saveConnectedAccount(uid, cookies);

    // Update internal state
    this.browserState = {
      status: 'connected',
      uid,
      isBrowserOpen: false,
      message: `Đã nạp cookie và kết nối thành công tài khoản Facebook (UID: ${uid})!`
    };

    return {
      success: true,
      uid,
      message: `Đã nạp cookie thành công! Tài khoản Facebook UID: ${uid} đã được kết nối.`
    };
  }

  /**
   * Save verified account session into SQLite
   */
  saveConnectedAccount(uid, cookies = []) {
    const sessionId = `fb-user-${uid}`;
    const now = new Date().toISOString();
    const tokenMasked = `UID_${uid}_COOKIE`;
    const cookiesJson = typeof cookies === 'string' ? cookies : JSON.stringify(cookies);

    // Upsert into account_sessions
    db.prepare(`
      INSERT OR REPLACE INTO account_sessions (
        id, platform, connection_name, account_id, auth_method, connection_status,
        granted_permissions, missing_permissions, token_masked, access_token, cookies,
        token_expires_at, last_verified_at, pages_discovered, error_history,
        created_at, updated_at
      ) VALUES (
        ?, 'facebook_page', ?, ?, 'playwright_browser', 'CONNECTED',
        '["browser_cookies", "read_profile", "group_posting_eligible"]', '[]', ?, ?, ?,
        ?, ?, '[]', '[]',
        COALESCE((SELECT created_at FROM account_sessions WHERE id = ?), ?), ?
      )
    `).run(
      sessionId,
      `Facebook cá nhân (UID: ${uid})`,
      uid,
      tokenMasked,
      cookiesJson,
      cookiesJson,
      new Date(Date.now() + 60 * 86400000).toISOString(),
      now,
      sessionId,
      now,
      now
    );

    console.log(`[PlaywrightAuth] Saved account session: ${sessionId} (UID: ${uid}, Status: CONNECTED)`);
  }

  /**
   * Get current browser & login state
   */
  getStatus() {
    return {
      ...this.browserState
    };
  }

  /**
   * Close browser manually if open
   */
  async closeBrowser() {
    if (this.currentContext) {
      try {
        await this.currentContext.close();
      } catch (_) {}
      this.currentContext = null;
      this.activePage = null;
    }
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.browserState = {
      status: 'idle',
      uid: null,
      isBrowserOpen: false,
      message: 'Trình duyệt đã đóng.'
    };
    return { success: true };
  }
}

module.exports = new PlaywrightAuthService();
