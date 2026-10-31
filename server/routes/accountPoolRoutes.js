const express = require('express');
const router = express.Router();
const db = require('../db');
const facebookAuthService = require('../facebookAuthService');
const playwrightAuthService = require('../playwrightAuthService');
const chromeStationService = require('../chromeStationService');

// Helper to sanitize account row before sending to frontend (NEVER expose access_token!)
function sanitizeAccount(acc) {
  if (!acc) return null;
  const { access_token, ...safeData } = acc;
  return {
    ...safeData,
    granted_permissions: typeof acc.granted_permissions === 'string' ? JSON.parse(acc.granted_permissions || '[]') : (acc.granted_permissions || []),
    missing_permissions: typeof acc.missing_permissions === 'string' ? JSON.parse(acc.missing_permissions || '[]') : (acc.missing_permissions || []),
    error_history: typeof acc.error_history === 'string' ? JSON.parse(acc.error_history || '[]') : (acc.error_history || []),
    pages_discovered: typeof acc.pages_discovered === 'string' ? JSON.parse(acc.pages_discovered || '[]') : (acc.pages_discovered || []),
    token_masked: acc.token_masked || (access_token ? facebookAuthService.maskToken(access_token) : 'NO_TOKEN')
  };
}

// 1. GET all accounts in pool
router.get('/', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM account_sessions ORDER BY created_at DESC').all();
    res.json({ success: true, data: accounts.map(sanitizeAccount) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== PHASE 4: LOCAL CHROME STATION 24/24 ==================== //

// Check Chrome Station 24/24 Status via 127.0.0.1:9222/json/version
router.get('/chrome-station/status', async (req, res) => {
  try {
    const status = await chromeStationService.checkStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, isOnline: false, error: err.message });
  }
});

// Launch Chrome Station 24/24
router.post('/chrome-station/launch', async (req, res) => {
  try {
    const result = await chromeStationService.launchStation();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.1 Launch Playwright Real Browser for Facebook Login (No OAuth / App ID)
router.post('/launch-browser', async (req, res) => {
  try {
    const result = await playwrightAuthService.launchBrowser();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.2 Check Playwright Browser Login Status
router.get('/browser-status', (req, res) => {
  try {
    const status = playwrightAuthService.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.2b Alternative alias GET /status for polling status
router.get('/status', (req, res) => {
  try {
    const status = playwrightAuthService.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.2c Immediate Cookie Check ("Đã đăng nhập xong - Kiểm tra ngay")
router.post('/check-browser-cookies', async (req, res) => {
  try {
    const result = await playwrightAuthService.checkCookiesNow();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.2d Quick Raw Cookie Import ("Nạp Cookie nhanh")
router.post('/import-cookie', async (req, res) => {
  try {
    const { cookie_string } = req.body;
    if (!cookie_string || !cookie_string.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp chuỗi cookie.' });
    }
    const result = await playwrightAuthService.importRawCookie(cookie_string.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.3 Close Playwright Browser
router.post('/close-browser', async (req, res) => {
  try {
    const result = await playwrightAuthService.closeBrowser();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.5 GET Facebook Connection Status (Health Check)
router.get('/facebook/status', (req, res) => {
  try {
    const fbAccount = db.prepare(`
      SELECT * FROM account_sessions 
      WHERE platform = 'facebook_page' 
      ORDER BY CASE WHEN connection_status = 'CONNECTED' THEN 0 ELSE 1 END, updated_at DESC 
      LIMIT 1
    `).get();

    if (!fbAccount) {
      return res.json({
        success: true,
        is_connected: false,
        status: 'NOT_CONNECTED',
        message: 'Chưa có tài khoản Facebook nào được kết nối với hệ thống.',
        account: null
      });
    }

    const sanitized = sanitizeAccount(fbAccount);
    const isConnected = fbAccount.connection_status === 'CONNECTED';

    return res.json({
      success: true,
      is_connected: isConnected,
      status: fbAccount.connection_status,
      message: isConnected 
        ? `Tài khoản ${fbAccount.connection_name} đang liên kết thành công.`
        : (fbAccount.last_error || `Trạng thái tài khoản: ${fbAccount.connection_status}`),
      account: sanitized
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2.6 GET single account by ID (must be after all specific routes!)
router.get('/:id', (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM account_sessions WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản kết nối.' });
    res.json({ success: true, data: sanitizeAccount(acc) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Step 1: Facebook OAuth Initiation
router.get('/facebook/oauth-init', (req, res) => {
  try {
    const { app_id, redirect_uri } = req.query;
    const initData = facebookAuthService.generateOAuthInitiation({
      appId: app_id,
      redirectUri: redirect_uri
    });
    res.json({ success: true, data: initData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Step 2-4: Verify and Connect Facebook Token directly with Meta Graph API
router.post('/facebook/connect-token', async (req, res) => {
  try {
    const { access_token, auth_method = 'oauth', custom_name } = req.body;
    if (!access_token || typeof access_token !== 'string' || access_token.trim().length < 8) {
      return res.status(400).json({
        success: false,
        status: 'AUTHENTICATION_REQUIRED',
        error: 'Vui lòng cung cấp mã Access Token hợp lệ từ Meta.'
      });
    }

    // Server-side verification with official Meta Graph API
    const metaCheck = await facebookAuthService.verifyAccessTokenWithMeta(access_token);

    if (!metaCheck.isValid) {
      return res.status(401).json({
        success: false,
        status: metaCheck.status || 'ERROR',
        errorCode: metaCheck.errorCode || 'META_REJECTED',
        error: metaCheck.errorMessage || 'Meta Graph API từ chối xác thực tài khoản.'
      });
    }

    // Save verified account with masked credentials
    const saved = await facebookAuthService.saveVerifiedAccount({
      user: metaCheck.user,
      accessToken: access_token.trim(),
      connectionStatus: metaCheck.status,
      grantedPermissions: metaCheck.granted_permissions,
      missingPermissions: metaCheck.missing_permissions,
      discoveredPages: metaCheck.discovered_pages,
      authMethod: auth_method,
      customName: custom_name
    });

    res.json({
      success: true,
      message: metaCheck.statusMessage || 'Xác thực tài khoản Facebook thành công!',
      data: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Facebook OAuth Redirect Callback handler
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle user cancellation / denied permissions
    if (error === 'access_denied' || error) {
      return res.redirect(`/index.html?oauth_status=cancelled&error_msg=${encodeURIComponent(error_description || 'Người dùng đã hủy cấp quyền xác thực trên Facebook.')}`);
    }

    // Verify CSRF state
    const isValidState = facebookAuthService.validateState(state);
    if (!isValidState) {
      return res.redirect(`/index.html?oauth_status=invalid_state&error_msg=${encodeURIComponent('Phiên xác thực bảo mật không hợp lệ hoặc đã hết hạn.')}`);
    }

    // Redirect to frontend with code to complete exchange
    res.redirect(`/index.html?oauth_status=success&code=${encodeURIComponent(code)}`);
  } catch (err) {
    res.redirect(`/index.html?oauth_status=error&error_msg=${encodeURIComponent(err.message)}`);
  }
});

// 6. Test Account Connection (Re-verifies against live Graph API)
router.post('/:id/test-connection', async (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM account_sessions WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });

    const now = new Date().toISOString();

    // If Facebook platform, verify with Meta Graph API
    if (acc.platform === 'facebook_page' && acc.access_token) {
      const metaCheck = await facebookAuthService.verifyAccessTokenWithMeta(acc.access_token);
      
      const newStatus = metaCheck.status;
      const missing = metaCheck.missing_permissions || [];
      const safePages = (metaCheck.discovered_pages || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        has_post_permission: p.has_post_permission
      }));

      db.prepare(`
        UPDATE account_sessions SET
          connection_status = ?,
          granted_permissions = ?,
          missing_permissions = ?,
          pages_discovered = ?,
          last_verified_at = ?,
          last_error = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        newStatus,
        JSON.stringify(metaCheck.granted_permissions || []),
        JSON.stringify(missing),
        JSON.stringify(safePages),
        now,
        metaCheck.isValid ? null : (metaCheck.errorMessage || 'Lỗi xác thực'),
        now,
        acc.id
      );

      return res.json({
        success: metaCheck.isValid,
        data: {
          id: acc.id,
          connection_status: newStatus,
          message: metaCheck.statusMessage || (metaCheck.isValid ? 'Kết nối Meta Graph API hợp lệ.' : metaCheck.errorMessage),
          missing_permissions: missing,
          discovered_pages: safePages,
          last_verified_at: now
        }
      });
    }

    // Default token expiration check for other providers
    let newStatus = 'CONNECTED';
    let message = 'Kiểm tra kết nối thành công.';
    let missingPermissions = [];

    if (acc.token_expires_at && new Date(acc.token_expires_at) < new Date()) {
      newStatus = 'TOKEN_EXPIRED';
      message = 'Phiên truy cập đã hết hạn. Vui lòng bấm Cấp lại quyền.';
    }

    db.prepare(`
      UPDATE account_sessions SET
        connection_status = ?,
        last_verified_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newStatus, now, now, acc.id);

    res.json({
      success: newStatus === 'CONNECTED',
      data: {
        id: acc.id,
        connection_status: newStatus,
        message,
        missing_permissions: missingPermissions,
        last_verified_at: now
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Re-authenticate / Refresh token
router.post('/:id/re-authenticate', (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM account_sessions WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });

    // Mark status AUTHENTICATION_REQUIRED or generate new OAuth initiation
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE account_sessions SET
        connection_status = 'AUTHENTICATION_REQUIRED',
        updated_at = ?
      WHERE id = ?
    `).run(now, acc.id);

    const initData = facebookAuthService.generateOAuthInitiation();

    res.json({
      success: true,
      message: 'Vui lòng mở trang Facebook chính thức để hoàn tất tái ủy quyền.',
      data: {
        id: acc.id,
        connection_status: 'AUTHENTICATION_REQUIRED',
        oauth_init: initData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Sync Discovered Pages to Channels catalog
router.post('/:id/sync-pages-to-channels', (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM account_sessions WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });

    let pages = [];
    try {
      pages = JSON.parse(acc.pages_discovered || '[]');
    } catch (e) {
      pages = [];
    }

    if (pages.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có Fanpage nào được tìm thấy trên tài khoản này.' });
    }

    const now = new Date().toISOString();
    const synced = [];

    db.transaction(() => {
      for (const page of pages) {
        const channelId = `chan-fb-${page.id}`;
        const existing = db.prepare('SELECT id FROM channels WHERE id = ? OR url LIKE ?').get(channelId, `%${page.id}%`);

        if (existing) {
          db.prepare(`
            UPDATE channels SET
              name = ?,
              publishing_capability = 'automatic_api',
              verification_status = 'verified',
              last_verified_at = ?,
              updated_at = ?
            WHERE id = ?
          `).run(page.name, now, now, existing.id);
          synced.push({ id: existing.id, name: page.name, action: 'updated' });
        } else {
          db.prepare(`
            INSERT INTO channels (
              id, name, url, channel_type, category, publishing_capability,
              verification_status, last_verified_at, notes, created_at, updated_at
            ) VALUES (
              ?, ?, ?, 'facebook_page', 'bat_dong_san', 'automatic_api',
              'verified', ?, 'Tự động đồng bộ từ tài khoản Facebook đã xác minh', ?, ?
            )
          `).run(
            channelId,
            page.name,
            `https://facebook.com/${page.id}`,
            now,
            now,
            now
          );
          synced.push({ id: channelId, name: page.name, action: 'created' });
        }
      }
    })();

    res.json({
      success: true,
      message: `Đã đồng bộ ${synced.length} Fanpage vào danh mục kênh đăng tin!`,
      data: synced
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Disconnect / Revoke account
router.delete('/:id', (req, res) => {
  try {
    const acc = db.prepare('SELECT * FROM account_sessions WHERE id = ?').get(req.params.id);
    if (!acc) return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });

    // Update status to DISCONNECTED or remove
    db.prepare('DELETE FROM account_sessions WHERE id = ?').run(req.params.id);

    // Audit log (Zero sensitive tokens logged)
    db.prepare(`
      INSERT INTO system_audit_logs (id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, 'FACEBOOK_ACCOUNT_DISCONNECTED', 'account_session', ?, ?, '127.0.0.1', ?)
    `).run(`audit-${Date.now()}`, req.params.id, `Đã ngắt kết nối và thu hồi phiên tài khoản "${acc.connection_name}".`, new Date().toISOString());

    res.json({ success: true, message: 'Đã ngắt kết nối tài khoản thành công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
