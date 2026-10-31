/**
 * Base Connector Interface
 * 
 * Standard contract for all platform publishing connectors.
 */
class BaseConnector {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }

  /**
   * Validate connector configuration and credentials
   */
  async validateConfig() {
    throw new Error('validateConfig() must be implemented by subclass');
  }

  /**
   * Validate content before sending to destination platform
   */
  validateContent(task, channel) {
    const errors = [];
    if (!task.content || !task.content.trim()) {
      errors.push('Nội dung bài viết không được để trống.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute publishing to destination platform
   * @param {Object} task 
   * @param {Object} channel 
   * @returns {Promise<Object>} Result with outcome_type, platform_post_id, published_url, or error
   */
  async publish(task, channel) {
    throw new Error('publish() must be implemented by subclass');
  }

  /**
   * Returns connector capabilities
   */
  getCapabilities() {
    return {
      name: this.name,
      type: this.type,
      supportsMedia: true,
      supportsScheduling: true,
      supportsDirectApi: false
    };
  }
}

module.exports = BaseConnector;
