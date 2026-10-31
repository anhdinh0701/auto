const BaseConnector = require('./BaseConnector');

/**
 * Facebook Group Connector (Manual-Workflow Enforced)
 * 
 * Strict Principle:
 * Meta Graph API v19+ does not support user-token automatic posting to arbitrary Facebook Groups.
 * In compliance with platform policies, this connector routes tasks to the guided manual publishing workflow.
 */
class FacebookGroupConnector extends BaseConnector {
  constructor() {
    super('Facebook Group Connector (Manual Workflow)', 'facebook_group');
  }

  async validateConfig() {
    return {
      isValid: true,
      message: 'Hội nhóm Facebook hoạt động theo quy trình xuất bản thủ công có hướng dẫn (tuân thủ chính sách Meta).'
    };
  }

  async publish(task, channel) {
    // Return needs_manual_action status with checklist and resources
    return {
      success: true,
      status: 'needs_manual_action',
      outcomeType: 'unknown',
      platformPostId: null,
      publishedUrl: null,
      errorCode: null,
      errorMessage: 'Hội nhóm Facebook yêu cầu kiểm duyệt và xuất bản thủ công. Hãy mở nhóm, dán nội dung đã chuẩn bị và xác nhận sau khi đăng xong.',
      manualWorkflow: {
        channelUrl: channel.url,
        checklist: [
          'Bấm nút "Mở nhóm Facebook" để chuyển tới giao diện nhóm',
          'Bấm nút "Sao chép toàn bộ bài viết" đã được chuẩn bị',
          'Tải hoặc chọn hình ảnh bất động sản từ danh sách ảnh đính kèm',
          'Dán nội dung và kiểm tra quy định kiểm duyệt của ban quản trị nhóm',
          'Đăng bài và quay lại đây bấm "Xác nhận đã đăng thành công"'
        ]
      }
    };
  }

  getCapabilities() {
    return {
      name: this.name,
      type: this.type,
      supportsMedia: true,
      supportsScheduling: true,
      supportsDirectApi: false, // Strictly manual
      requiresManualConfirmation: true
    };
  }
}

module.exports = FacebookGroupConnector;
