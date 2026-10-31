const BaseConnector = require('./BaseConnector');

/**
 * Real Estate Portal Connector (Batdongsan / Chotot Webhook/Partner API)
 */
class PortalConnector extends BaseConnector {
  constructor(credentials = null) {
    super('Real Estate Portal Connector', 'portal');
    this.credentials = credentials;
  }

  async validateConfig() {
    if (!this.credentials || !this.credentials.access_token) {
      return {
        isValid: false,
        errorCode: 'PARTNER_KEY_MISSING',
        message: 'Chưa cấu hình Khóa tích hợp đối tác (Partner API Key) cho Cổng BĐS. Vui lòng cấp API key hoặc chuyển sang quy trình xuất bản thủ công.'
      };
    }
    return { isValid: true };
  }

  async publish(task, channel) {
    const configCheck = await this.validateConfig();
    if (!configCheck.isValid) {
      // If not configured, provide manual posting option
      return {
        success: false,
        status: 'needs_manual_action',
        outcomeType: 'unknown',
        errorCode: configCheck.errorCode,
        errorMessage: configCheck.message,
        manualWorkflow: {
          channelUrl: channel.url,
          checklist: [
            'Truy cập cổng đăng tin: ' + channel.url,
            'Sao chép tiêu đề và mô tả bài viết đã chuẩn bị sẵn',
            'Tải ảnh bất động sản lên form đăng tin của cổng BĐS',
            'Bấm "Xác nhận đã đăng" sau khi tin đã được xuất bản'
          ]
        }
      };
    }

    try {
      const endpoint = this.credentials.api_endpoint || 'https://api.batdongsan.com.vn/v1/listings';
      const payload = {
        title: task.title,
        content: task.content,
        mediaUrls: Array.isArray(task.media_urls) ? task.media_urls : JSON.parse(task.media_urls || '[]'),
        contactInfo: typeof task.contact_info === 'string' ? JSON.parse(task.contact_info || '{}') : task.contact_info,
        externalId: task.id
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
          errorCode: 'PORTAL_API_ERROR',
          errorMessage: data.message || 'Cổng BĐS phản hồi lỗi khi nhận tin.'
        };
      }

      return {
        success: true,
        status: 'published',
        outcomeType: 'platform_confirmed',
        platformPostId: data.listingId || data.id,
        publishedUrl: data.url || channel.url,
        errorMessage: null
      };
    } catch (err) {
      return {
        success: false,
        status: 'failed',
        outcomeType: 'failed',
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Lỗi kết nối cổng đăng tin: ${err.message}`
      };
    }
  }

  getCapabilities() {
    return {
      name: this.name,
      type: this.type,
      supportsMedia: true,
      supportsScheduling: true,
      supportsDirectApi: Boolean(this.credentials && this.credentials.access_token)
    };
  }
}

module.exports = PortalConnector;
