const BaseConnector = require('./BaseConnector');

/**
 * Facebook Page Connector (Meta Graph API)
 * 
 * Uses official Graph API endpoints where eligible.
 * Requires page access token and pages_manage_posts permission.
 */
class FacebookPageConnector extends BaseConnector {
  constructor(credentials = null) {
    super('Facebook Page Connector', 'facebook_page');
    this.credentials = credentials;
  }

  async validateConfig() {
    if (!this.credentials || !this.credentials.access_token || !this.credentials.page_id) {
      return {
        isValid: false,
        errorCode: 'AUTH_MISSING',
        message: 'Facebook Page Access Token hoặc Page ID chưa được cấu hình. Cần cấp quyền pages_manage_posts và pages_read_engagement từ Meta Business Suite.'
      };
    }
    return { isValid: true };
  }

  validateContent(task, channel) {
    const res = super.validateContent(task, channel);
    if (!task.title && !task.content) {
      res.isValid = false;
      res.errors.push('Bài đăng Facebook cần có nội dung văn bản.');
    }
    return res;
  }

  async publish(task, channel) {
    const configCheck = await this.validateConfig();
    if (!configCheck.isValid) {
      return {
        success: false,
        status: 'failed',
        outcomeType: 'failed',
        errorCode: configCheck.errorCode,
        errorMessage: configCheck.message
      };
    }

    const { page_id, access_token, api_endpoint = 'https://graph.facebook.com/v19.0' } = this.credentials;

    // Prepare message with hashtags and link
    let message = task.content || '';
    if (task.hashtags) {
      message += `\n\n${task.hashtags}`;
    }

    const mediaUrls = Array.isArray(task.media_urls) 
      ? task.media_urls 
      : (typeof task.media_urls === 'string' ? JSON.parse(task.media_urls || '[]') : []);

    try {
      let postUrl = `${api_endpoint}/${page_id}/feed`;
      let payload = {
        message,
        access_token
      };

      // If single image available
      if (mediaUrls.length > 0 && /^https?:\/\//i.test(mediaUrls[0])) {
        postUrl = `${api_endpoint}/${page_id}/photos`;
        payload = {
          url: mediaUrls[0],
          caption: message,
          access_token
        };
      }

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const fbErr = data.error || {};
        return {
          success: false,
          status: 'failed',
          outcomeType: 'failed',
          errorCode: `FB_ERR_${fbErr.code || 'UNKNOWN'}`,
          errorMessage: fbErr.message || 'Meta Graph API từ chối yêu cầu đăng bài.'
        };
      }

      // Success confirmed by Meta platform
      const postId = data.id || data.post_id;
      const permalink = `https://www.facebook.com/${postId}`;

      return {
        success: true,
        status: 'published',
        outcomeType: 'platform_confirmed',
        platformPostId: postId,
        publishedUrl: permalink,
        errorMessage: null
      };
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        outcomeType: 'failed',
        errorCode: 'NETWORK_TIMEOUT',
        errorMessage: `Lỗi kết nối tới Meta Graph API: ${err.message}`
      };
    }
  }

  getCapabilities() {
    return {
      name: this.name,
      type: this.type,
      supportsMedia: true,
      supportsScheduling: true,
      supportsDirectApi: true,
      requiresOAuth: true,
      requiredPermissions: ['pages_manage_posts', 'pages_read_engagement']
    };
  }
}

module.exports = FacebookPageConnector;
