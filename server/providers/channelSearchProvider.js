/**
 * Channel Search Provider Interface
 * 
 * Provides an extensible architecture for official public search engines
 * or platform APIs (e.g., Google Custom Search API, Facebook Graph API).
 * 
 * Strict Principle:
 * - Does NOT scrape restricted content, bypass login or bypass CAPTCHA.
 * - Does NOT fabricate or invent mock search results.
 * - If provider API keys are not configured in environment, returns clear
 *   instruction and status so users know manual entry / CSV import is active.
 */

class ChannelSearchProvider {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || null;
    this.googleCx = process.env.GOOGLE_SEARCH_CX || null;
    this.fbGraphToken = process.env.FACEBOOK_GRAPH_API_TOKEN || null;
  }

  isConfigured() {
    return Boolean((this.googleApiKey && this.googleCx) || this.fbGraphToken);
  }

  getStatus() {
    return {
      isConfigured: this.isConfigured(),
      providers: {
        googleSearch: Boolean(this.googleApiKey && this.googleCx),
        facebookGraph: Boolean(this.fbGraphToken)
      },
      message: this.isConfigured()
        ? 'Nhà cung cấp tìm kiếm trực tuyến đã được cấu hình.'
        : 'Search provider chưa được cấu hình khóa API (Google Search API hoặc Facebook Graph API). Vui lòng sử dụng tính năng Thêm kênh thủ công hoặc Nhập từ CSV.',
      instructions: [
        'Hệ thống tuân thủ chính sách bảo mật: không cào dữ liệu trái phép (scraping), không vượt CAPTCHA hay giả mạo kết quả tìm kiếm.',
        'Để tìm kiếm kênh tự động qua API, vui lòng cấu hình biến môi trường GOOGLE_SEARCH_API_KEY và GOOGLE_SEARCH_CX hoặc FACEBOOK_GRAPH_API_TOKEN trong tệp .env.',
        'Hiện tại bạn có thể thêm kênh thủ công nhanh chóng hoặc sử dụng tính năng Nhập danh sách kênh qua tệp CSV đã chuẩn bị.'
      ],
      manualDiscoveryLinks: [
        {
          name: 'Tìm nhóm Facebook BĐS trên Google',
          urlTemplate: 'https://www.google.com/search?q=site%3Afacebook.com%2Fgroups+bất+động+sản+{location}'
        },
        {
          name: 'Tìm nhóm Zalo BĐS trên Google',
          urlTemplate: 'https://www.google.com/search?q=zalo.me%2Fg%2F+bất+động+sản+{location}'
        },
        {
          name: 'Tìm diễn đàn BĐS',
          urlTemplate: 'https://www.google.com/search?q=diễn+đàn+bất+động+sản+{location}'
        }
      ]
    };
  }

  async search(query, filters = {}) {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        results: [],
        status: this.getStatus()
      };
    }

    // Future extension: when official keys are supplied, query official Google / Graph APIs
    // For now, securely returns empty with configured status
    return {
      success: true,
      isConfigured: true,
      results: [],
      status: this.getStatus()
    };
  }
}

module.exports = new ChannelSearchProvider();
