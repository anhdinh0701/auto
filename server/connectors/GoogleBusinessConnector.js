const BaseConnector = require('./BaseConnector');

/**
 * Google Business Profile Connector
 * 
 * Separate from general real estate listing portals.
 * Uses official Google My Business API for local business posts.
 */
class GoogleBusinessConnector extends BaseConnector {
  constructor(credentials = null) {
    super('Google Business Profile Connector', 'google_business');
    this.credentials = credentials;
  }

  async validateConfig() {
    if (!this.credentials || !this.credentials.access_token || !this.credentials.page_id) {
      return {
        isValid: false,
        errorCode: 'GBP_AUTH_MISSING',
        message: 'Google Business Profile chưa được liên kết tài khoản OAuth hoặc thiếu Location ID. Lưu ý: Google Business Profile chỉ dùng đăng bài cập nhật doanh nghiệp địa phương, không phải API đăng tin BĐS cá nhân lên Google Search.'
      };
    }
    return { isValid: true };
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

    // Official Google My Business API execution
    try {
      const locationId = this.credentials.page_id;
      const endpoint = `https://mybusiness.googleapis.com/v4/${locationId}/localPosts`;

      const payload = {
        languageCode: 'vi',
        summary: task.content,
        callToAction: {
          actionType: 'CALL',
          url: task.cta_link || ''
        },
        topicType: 'STANDARD'
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: 'failed',
          outcomeType: 'failed',
          errorCode: 'GBP_API_ERROR',
          errorMessage: data.error?.message || 'Google Business API từ chối bài đăng.'
        };
      }

      return {
        success: true,
        status: 'published',
        outcomeType: 'platform_confirmed',
        platformPostId: data.name || data.id,
        publishedUrl: data.searchUrl || channel.url,
        errorMessage: null
      };
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        outcomeType: 'failed',
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Lỗi kết nối Google Business API: ${err.message}`
      };
    }
  }

  getCapabilities() {
    return {
      name: this.name,
      type: this.type,
      supportsMedia: true,
      supportsScheduling: true,
      supportsDirectApi: Boolean(this.credentials && this.credentials.access_token),
      limitations: 'Chỉ áp dụng cho bài đăng cập nhật của Trang Doanh nghiệp địa phương đã xác minh trên Google Maps.'
    };
  }
}

module.exports = GoogleBusinessConnector;
