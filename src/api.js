const API_BASE = '/api';

export const api = {
  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Không thể lấy dữ liệu thống kê');
    return res.json();
  },

  // Listings
  async getListings(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/listings?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách tin');
    return res.json();
  },

  async getListing(id) {
    const res = await fetch(`${API_BASE}/listings/${id}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết tin');
    return res.json();
  },

  async createListing(data) {
    const res = await fetch(`${API_BASE}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo tin');
    return result;
  },

  async updateListing(id, data) {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật tin');
    return result;
  },

  async deleteListing(id) {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa tin');
    return result;
  },

  async cloneListing(id) {
    const res = await fetch(`${API_BASE}/listings/${id}/clone`, {
      method: 'POST'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi nhân bản tin');
    return result;
  },

  // Upload Images
  async uploadImages(files, listingId = null) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    if (listingId) {
      formData.append('listing_id', listingId);
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi tải ảnh lên');
    return result;
  },

  // Photo Gallery
  async getPhotos() {
    const res = await fetch(`${API_BASE}/photos`);
    if (!res.ok) throw new Error('Không thể tải thư viện ảnh');
    return res.json();
  },

  async deletePhoto(id) {
    const res = await fetch(`${API_BASE}/photos/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa ảnh');
    return result;
  },

  // Templates
  async getTemplates() {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Không thể tải mẫu nội dung');
    return res.json();
  },

  async createTemplate(data) {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo mẫu');
    return result;
  },

  async updateTemplate(id, data) {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật mẫu');
    return result;
  },

  async deleteTemplate(id) {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa mẫu');
    return result;
  },

  // ---------------- PHASE 2: CHANNEL DISCOVERY ---------------- //

  async getChannels(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/channels?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách kênh');
    return res.json();
  },

  async getChannel(id, criteria = {}) {
    const query = new URLSearchParams();
    Object.entries(criteria).forEach(([key, val]) => {
      if (val) query.append(key, val);
    });
    const res = await fetch(`${API_BASE}/channels/${id}?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết kênh');
    return res.json();
  },

  async createChannel(data) {
    const res = await fetch(`${API_BASE}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo kênh');
    return result;
  },

  async updateChannel(id, data) {
    const res = await fetch(`${API_BASE}/channels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật kênh');
    return result;
  },

  async deleteChannel(id) {
    const res = await fetch(`${API_BASE}/channels/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa kênh');
    return result;
  },

  async toggleFavoriteChannel(id) {
    const res = await fetch(`${API_BASE}/channels/${id}/toggle-favorite`, {
      method: 'POST'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi đổi trạng thái yêu thích');
    return result;
  },

  async verifyChannel(id) {
    const res = await fetch(`${API_BASE}/channels/${id}/verify`, {
      method: 'POST'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xác minh kênh');
    return result;
  },

  async bulkDeleteChannels(channelIds) {
    const res = await fetch(`${API_BASE}/channels/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa hàng loạt');
    return result;
  },

  async bulkVerifyChannels(channelIds) {
    const res = await fetch(`${API_BASE}/channels/bulk-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xác minh hàng loạt');
    return result;
  },

  async bulkCollectionChannels(channelIds, collectionId, action = 'add') {
    const res = await fetch(`${API_BASE}/channels/bulk-collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelIds, collectionId, action })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi gán bộ sưu tập');
    return result;
  },

  async importChannelsCsv(csvData, duplicateMode = 'skip') {
    const res = await fetch(`${API_BASE}/channels/import-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData, duplicateMode })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi nhập CSV');
    return result;
  },

  getExportCsvUrl() {
    return `${API_BASE}/channels/export-csv`;
  },

  async getSearchProviderStatus() {
    const res = await fetch(`${API_BASE}/channels/search-provider`);
    if (!res.ok) throw new Error('Không thể kiểm tra search provider');
    return res.json();
  },

  async searchProvider(query, filters = {}) {
    const res = await fetch(`${API_BASE}/channels/search-provider/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters })
    });
    return res.json();
  },

  async getScoreSettings() {
    const res = await fetch(`${API_BASE}/channels/score-settings`);
    if (!res.ok) throw new Error('Không thể tải cài đặt trọng số');
    return res.json();
  },

  async updateScoreSettings(data) {
    const res = await fetch(`${API_BASE}/channels/score-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi cập nhật trọng số');
    return result;
  },

  // Collections API
  async getCollections() {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) throw new Error('Không thể tải bộ sưu tập kênh');
    return res.json();
  },

  async createCollection(data) {
    const res = await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo bộ sưu tập');
    return result;
  },

  async updateCollection(id, data) {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi sửa bộ sưu tập');
    return result;
  },

  async deleteCollection(id) {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa bộ sưu tập');
    return result;
  },

  // ---------------- PHASE 3: PUBLISHING AUTOMATION API ---------------- //

  async getPublishingStats() {
    const res = await fetch(`${API_BASE}/publishing/stats`);
    if (!res.ok) throw new Error('Không thể tải thống kê xuất bản');
    return res.json();
  },

  async getPublishingTasks(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/publishing/tasks?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách nhiệm vụ xuất bản');
    return res.json();
  },

  async getPublishingTask(id) {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết nhiệm vụ');
    return res.json();
  },

  async createPublishingTasks(data) {
    const res = await fetch(`${API_BASE}/publishing/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo nhiệm vụ xuất bản');
    return result;
  },

  async updatePublishingTask(id, data) {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật nhiệm vụ');
    return result;
  },

  async deletePublishingTask(id) {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xóa nhiệm vụ');
    return result;
  },

  async cancelPublishingTask(id) {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}/cancel`, {
      method: 'POST'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi hủy lịch xuất bản');
    return result;
  },

  async retryPublishingTask(id) {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}/retry`, {
      method: 'POST'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi thử lại nhiệm vụ');
    return result;
  },

  async confirmManualPublish(id, published_url = '') {
    const res = await fetch(`${API_BASE}/publishing/tasks/${id}/confirm-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published_url })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi xác nhận xuất bản thủ công');
    return result;
  },

  async getConnectors() {
    const res = await fetch(`${API_BASE}/connectors`);
    if (!res.ok) throw new Error('Không thể tải danh sách connectors');
    return res.json();
  },

  async updateConnector(id, data) {
    const res = await fetch(`${API_BASE}/connectors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật connector');
    return result;
  },

  async testConnector(id) {
    const res = await fetch(`${API_BASE}/connectors/${id}/test`, {
      method: 'POST'
    });
    return res.json();
  },

  // Namespaced aliases for convenience across components
  listings: {
    getAll: async (params) => {
      const data = await api.getListings(params);
      return data.items || data;
    },
    get: (id) => api.getListing(id)
  },

  channels: {
    getAll: async (params = {}) => {
      const data = await api.getChannels({ limit: 100, ...params });
      return data.items || data;
    },
    getCollections: () => api.getCollections()
  },

  publishing: {
    getStats: () => api.getPublishingStats(),
    getTasks: (params) => api.getPublishingTasks(params),
    getTask: (id) => api.getPublishingTask(id),
    createTasks: (data) => api.createPublishingTasks(data),
    cancelTask: (id) => api.cancelPublishingTask(id),
    retryTask: (id) => api.retryPublishingTask(id),
    deleteTask: (id) => api.deletePublishingTask(id),
    confirmManual: (id, url) => api.confirmManualPublish(id, url)
  },

  connectors: {
    getAll: () => api.getConnectors(),
    update: (id, data) => api.updateConnector(id, data),
    test: (id) => api.testConnector(id)
  },

  // ---------------- PHASE 4: CLIENT API ---------------- //
  analytics: {
    getDashboard: async (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, v);
      });
      const res = await fetch(`${API_BASE}/analytics/dashboard?${q.toString()}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu phân tích');
      return res.json();
    },
    addManualEntry: async (data) => {
      const res = await fetch(`${API_BASE}/analytics/manual-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Không thể ghi nhận số liệu thủ công');
      return res.json();
    },
    getEntries: async () => {
      const res = await fetch(`${API_BASE}/analytics/entries`);
      return res.json();
    }
  },

  ai: {
    getSettings: async () => {
      const res = await fetch(`${API_BASE}/ai/settings`);
      return res.json();
    },
    updateSettings: async (data) => {
      const res = await fetch(`${API_BASE}/ai/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    testConnection: async () => {
      const res = await fetch(`${API_BASE}/ai/test`, { method: 'POST' });
      return res.json();
    },
    generateHeadlines: async (listingId, listingData) => {
      const res = await fetch(`${API_BASE}/ai/headlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, listing_data: listingData })
      });
      return res.json();
    },
    rewrite: async (listingId, listingData, channelType, targetAudience) => {
      const res = await fetch(`${API_BASE}/ai/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          listing_data: listingData,
          channel_type: channelType,
          target_audience: targetAudience
        })
      });
      return res.json();
    },
    checkQuality: async (title, description, listingData) => {
      const res = await fetch(`${API_BASE}/ai/quality-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, listing_data: listingData })
      });
      return res.json();
    },
    checkDuplicate: async (title, description, listingId) => {
      const res = await fetch(`${API_BASE}/ai/duplicate-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, listing_id: listingId })
      });
      return res.json();
    },
    checkConsistency: async (listingId, listingData, title, description) => {
      const res = await fetch(`${API_BASE}/ai/consistency-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          listing_data: listingData,
          title,
          description
        })
      });
      return res.json();
    },
    getBestTime: async (channelType) => {
      const res = await fetch(`${API_BASE}/ai/best-time?channel_type=${encodeURIComponent(channelType || '')}`);
      return res.json();
    }
  },

  leads: {
    getAll: async (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, v);
      });
      const res = await fetch(`${API_BASE}/leads?${q.toString()}`);
      return res.json();
    },
    get: async (id) => {
      const res = await fetch(`${API_BASE}/leads/${id}`);
      return res.json();
    },
    create: async (data) => {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Lỗi khi tạo khách hàng');
      return result;
    },
    update: async (id, data) => {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Lỗi khi cập nhật khách hàng');
      return result;
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
      return res.json();
    },
    addActivity: async (id, activity) => {
      const res = await fetch(`${API_BASE}/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      });
      return res.json();
    },
    getUpcomingReminders: async () => {
      const res = await fetch(`${API_BASE}/leads/reminders/upcoming`);
      return res.json();
    },
    getExportCsvUrl: () => `${API_BASE}/leads/export/csv`,
    importCsv: async (csvData) => {
      const res = await fetch(`${API_BASE}/leads/import/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: csvData
      });
      return res.json();
    }
  },

  automation: {
    getRules: async () => {
      const res = await fetch(`${API_BASE}/automation/rules`);
      return res.json();
    },
    createRule: async (data) => {
      const res = await fetch(`${API_BASE}/automation/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    updateRule: async (id, data) => {
      const res = await fetch(`${API_BASE}/automation/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    deleteRule: async (id) => {
      const res = await fetch(`${API_BASE}/automation/rules/${id}`, { method: 'DELETE' });
      return res.json();
    },
    toggleRule: async (id, isEnabled) => {
      const res = await fetch(`${API_BASE}/automation/rules/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: isEnabled })
      });
      return res.json();
    },
    testRule: async (id) => {
      const res = await fetch(`${API_BASE}/automation/rules/${id}/test`, { method: 'POST' });
      return res.json();
    },
    getLogs: async (limit = 50) => {
      const res = await fetch(`${API_BASE}/automation/logs?limit=${limit}`);
      return res.json();
    }
  },

  operations: {
    getOverview: async () => {
      const res = await fetch(`${API_BASE}/operations/overview`);
      return res.json();
    },
    getAuditLogs: async (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) q.append(k, v);
      });
      const res = await fetch(`${API_BASE}/operations/audit-logs?${q.toString()}`);
      return res.json();
    },
    retryAllFailed: async () => {
      const res = await fetch(`${API_BASE}/operations/retry-all-failed`, { method: 'POST' });
      return res.json();
    }
  }
};
