const crypto = require('crypto');
const db = require('./db');

/**
 * Meta Facebook Official Graph API Authentication & Verification Service
 * 
 * Strict Security Principles:
 * - Uses official Meta Graph API endpoints (v20.0).
 * - Never collects, proxies, or stores user passwords or session cookies.
 * - Never intercepts SMS, OTP, or CAPTCHA checkpoints.
 * - Never marks accounts CONNECTED without server-side Graph API verification.
 * - Access tokens stored only on server; responses mask secrets.
 */
class FacebookAuthService {
  constructor() {
    this.graphApiBase = 'https://graph.facebook.com/v20.0';
    this.oauthDialogBase = 'https://www.facebook.com/v20.0/dialog/oauth';
    
    // Required permissions for Page publishing
    this.requiredPermissions = ['pages_show_list', 'pages_manage_posts'];
    this.recommendedPermissions = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'public_profile'];
  }

  /**
   * Helper to mask token for frontend display
   */
  maskToken(token) {
    if (!token) return 'NO_TOKEN';
    if (token.length <= 10) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }

  /**
   * Step 1: Initialize official OAuth flow
   * Generates secure random state to prevent CSRF attacks
   */
  generateOAuthInitiation(options = {}) {
    const {
      appId = process.env.META_APP_ID || '109283746192837', // Default or user-configured
      redirectUri = options.redirectUri || 'http://localhost:3001/api/accounts/facebook/callback'
    } = options;

    const state = `fb_state_${crypto.randomBytes(16).toString('hex')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Store state in DB
    db.prepare(`
      INSERT OR REPLACE INTO facebook_oauth_states (state, created_at, redirect_uri, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(state, now.toISOString(), redirectUri, expiresAt);

    const scopeStr = this.recommendedPermissions.join(',');
    const oauthUrl = `${this.oauthDialogBase}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopeStr}&response_type=code`;

    return {
      state,
      app_id: appId,
      redirect_uri: redirectUri,
      oauth_url: oauthUrl,
      expires_at: expiresAt,
      guidance: {
        step1: 'Nhấp mở cửa sổ đăng nhập Facebook chính thức của Meta.',
        step2: 'Tự nhập email/số điện thoại và mật khẩu trực tiếp trên tên miền facebook.com an toàn.',
        step3: 'Nếu Facebook yêu cầu xác minh bảo mật (2FA / SMS OTP), nhận mã trên điện thoại và nhập trực tiếp trên Facebook.',
        step4: 'Chọn các Fanpage BĐS mà bạn quản lý và đồng ý cấp quyền xuất bản bài viết.'
      }
    };
  }

  /**
   * Validates state parameter to prevent CSRF attacks
   */
  validateState(state) {
    if (!state) return false;
    const row = db.prepare('SELECT * FROM facebook_oauth_states WHERE state = ?').get(state);
    if (!row) return false;
    
    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM facebook_oauth_states WHERE state = ?').run(state);
      return false;
    }

    // Clean up consumed state
    db.prepare('DELETE FROM facebook_oauth_states WHERE state = ?').run(state);
    return true;
  }

  /**
   * Step 2 & 4: Verifies an access token directly with Meta Graph API
   * Performs live server-side verification:
   * 1. GET /me (User profile & ID)
   * 2. GET /me/permissions (Check granted scopes)
   * 3. GET /me/accounts (Discover managed Pages)
   */
  async verifyAccessTokenWithMeta(accessToken) {
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 10) {
      return {
        isValid: false,
        status: 'AUTHENTICATION_REQUIRED',
        errorCode: 'INVALID_TOKEN_FORMAT',
        errorMessage: 'Mã Access Token không hợp lệ hoặc để trống.'
      };
    }

    const cleanToken = accessToken.trim();

    try {
      // 1. Verify User Identity via Graph API /me
      const meRes = await fetch(`${this.graphApiBase}/me?fields=id,name,picture&access_token=${encodeURIComponent(cleanToken)}`, {
        signal: AbortSignal.timeout(10000)
      });
      const meData = await meRes.json();

      if (!meRes.ok || meData.error) {
        const fbErr = meData.error || {};
        let status = 'ERROR';
        if (fbErr.code === 190) {
          if (fbErr.error_subcode === 463 || fbErr.error_subcode === 467) {
            status = 'TOKEN_EXPIRED';
          } else {
            status = 'REAUTH_REQUIRED';
          }
        }
        return {
          isValid: false,
          status,
          errorCode: `FB_ERR_${fbErr.code || 'UNKNOWN'}`,
          errorMessage: fbErr.message || 'Meta Graph API từ chối xác thực token.'
        };
      }

      // 2. Verify Permissions via /me/permissions
      const permRes = await fetch(`${this.graphApiBase}/me/permissions?access_token=${encodeURIComponent(cleanToken)}`, {
        signal: AbortSignal.timeout(8000)
      });
      const permData = await permRes.json();
      
      const permissionsList = Array.isArray(permData.data) ? permData.data : [];
      const grantedPermissions = permissionsList.filter(p => p.status === 'granted').map(p => p.permission);
      const declinedPermissions = permissionsList.filter(p => p.status === 'declined').map(p => p.permission);

      // Check required permissions
      const missingRequired = this.requiredPermissions.filter(p => !grantedPermissions.includes(p));

      // 3. Discover Managed Facebook Pages via /me/accounts
      const accountsRes = await fetch(`${this.graphApiBase}/me/accounts?fields=id,name,category,access_token,tasks&access_token=${encodeURIComponent(cleanToken)}`, {
        signal: AbortSignal.timeout(10000)
      });
      const accountsData = await accountsRes.json();
      const rawPages = Array.isArray(accountsData.data) ? accountsData.data : [];

      const discoveredPages = rawPages.map(page => ({
        id: page.id,
        name: page.name,
        category: page.category || 'Trang Bất Động Sản',
        has_post_permission: Array.isArray(page.tasks) ? (page.tasks.includes('CREATE_CONTENT') || page.tasks.includes('MANAGE')) : true,
        page_token_masked: this.maskToken(page.access_token)
      }));

      // Determine final verified status
      let connectionStatus = 'CONNECTED';
      let statusMessage = 'Tài khoản Facebook và các Fanpage đã được xác minh thành công qua Meta Graph API.';

      if (missingRequired.length > 0) {
        connectionStatus = 'PERMISSION_MISSING';
        statusMessage = `Tài khoản thiếu quyền bắt buộc: ${missingRequired.join(', ')}. Cần cấp quyền quản lý bài viết để hệ thống có thể đăng bài.`;
      }

      return {
        isValid: connectionStatus === 'CONNECTED' || connectionStatus === 'PERMISSION_MISSING',
        status: connectionStatus,
        statusMessage,
        user: {
          id: meData.id,
          name: meData.name,
          picture: meData.picture?.data?.url || null
        },
        granted_permissions: grantedPermissions,
        missing_permissions: missingRequired,
        declined_permissions: declinedPermissions,
        discovered_pages: discoveredPages,
        page_count: discoveredPages.length,
        verified_at: new Date().toISOString()
      };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
        return {
          isValid: false,
          status: 'ERROR',
          errorCode: 'NETWORK_TIMEOUT',
          errorMessage: 'Hết thời gian kết nối (Timeout) tới máy chủ Meta Graph API. Vui lòng kiểm tra kết nối mạng.'
        };
      }
      return {
        isValid: false,
        status: 'ERROR',
        errorCode: 'GRAPH_API_ERROR',
        errorMessage: 'Lỗi giao tiếp Meta Graph API: ' + err.message
      };
    }
  }

  /**
   * Complete connection and store in account_sessions safely
   */
  async saveVerifiedAccount({
    id,
    user,
    accessToken,
    connectionStatus,
    grantedPermissions,
    missingPermissions,
    discoveredPages = [],
    authMethod = 'oauth',
    customName
  }) {
    const sessionId = id || `fb-sess-${user.id || Date.now()}`;
    const now = new Date().toISOString();
    const tokenMasked = this.maskToken(accessToken);
    const expiresAt = new Date(Date.now() + 60 * 86400000).toISOString(); // 60 days for Long-Lived Token
    const avatarUrl = user?.picture || null;
    const displayName = customName && customName.trim() ? customName.trim() : `Facebook - ${user?.name || 'Tài khoản Meta'}`;

    // Clean sensitive tokens before storing pages JSON
    const safeDiscoveredPages = discoveredPages.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      has_post_permission: p.has_post_permission
    }));

    // Upsert into account_sessions
    db.prepare(`
      INSERT OR REPLACE INTO account_sessions (
        id, platform, connection_name, account_id, auth_method, connection_status,
        granted_permissions, missing_permissions, token_masked, access_token,
        token_expires_at, last_verified_at, pages_discovered, avatar_url, error_history,
        created_at, updated_at
      ) VALUES (
        ?, 'facebook_page', ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, '[]',
        COALESCE((SELECT created_at FROM account_sessions WHERE id = ?), ?), ?
      )
    `).run(
      sessionId,
      displayName,
      user.id,
      authMethod,
      connectionStatus,
      JSON.stringify(grantedPermissions || []),
      JSON.stringify(missingPermissions || []),
      tokenMasked,
      accessToken, // Stored strictly in SQLite on server, never returned in public API
      expiresAt,
      now,
      JSON.stringify(safeDiscoveredPages),
      avatarUrl,
      sessionId,
      now,
      now
    );

    // Sync with connector_credentials so FacebookPageConnector can directly publish
    db.prepare(`
      INSERT OR REPLACE INTO connector_credentials (
        id, connector_type, account_name, access_token, page_id, is_active, status, last_validated_at, updated_at
      ) VALUES (
        'facebook_page', 'facebook_page', ?, ?, ?, 1, 'connected', ?, ?
      )
    `).run(
      user.name,
      accessToken,
      discoveredPages[0]?.id || user.id,
      now,
      now
    );

    // Audit log (Zero sensitive credentials logged)
    db.prepare(`
      INSERT INTO system_audit_logs (id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, 'FACEBOOK_ACCOUNT_CONNECTED', 'account_session', ?, ?, '127.0.0.1', ?)
    `).run(
      `audit-${Date.now()}`,
      sessionId,
      `Kết nối tài khoản Facebook "${user.name}" thành công qua Meta Graph API. Phát hiện ${discoveredPages.length} Fanpage. Trạng thái: ${connectionStatus}.`,
      now
    );

    return {
      id: sessionId,
      platform: 'facebook_page',
      connection_name: `Facebook - ${user.name}`,
      account_id: user.id,
      connection_status: connectionStatus,
      token_masked: tokenMasked,
      granted_permissions: grantedPermissions,
      missing_permissions: missingPermissions,
      discovered_pages: safeDiscoveredPages,
      token_expires_at: expiresAt,
      last_verified_at: now
    };
  }
}

module.exports = new FacebookAuthService();
