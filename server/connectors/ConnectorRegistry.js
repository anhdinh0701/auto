const db = require('../db');
const FacebookPageConnector = require('./FacebookPageConnector');
const FacebookGroupConnector = require('./FacebookGroupConnector');
const PortalConnector = require('./PortalConnector');
const GoogleBusinessConnector = require('./GoogleBusinessConnector');

/**
 * Connector Registry & Factory
 */
class ConnectorRegistry {
  getCredentials(connectorType) {
    try {
      const row = db.prepare('SELECT * FROM connector_credentials WHERE connector_type = ? AND is_active = 1').get(connectorType);
      return row || null;
    } catch (e) {
      return null;
    }
  }

  getConnectorForChannel(channel) {
    const channelType = channel.channel_type || '';
    const publishingCapability = channel.publishing_capability || '';

    // Facebook Groups ALWAYS use manual workflow connector
    if (channelType === 'facebook_group' || publishingCapability === 'manual_only') {
      return new FacebookGroupConnector();
    }

    // Facebook Pages
    if (channelType === 'facebook_page') {
      const creds = this.getCredentials('facebook_page');
      return new FacebookPageConnector(creds);
    }

    // Real Estate Portals
    if (channelType === 'portal' || channelType === 'forum') {
      const creds = this.getCredentials('batdongsan_portal');
      return new PortalConnector(creds);
    }

    // Google Business
    if (channelType === 'google_business') {
      const creds = this.getCredentials('google_business');
      return new GoogleBusinessConnector(creds);
    }

    // Default fallback: guided manual connector
    return new FacebookGroupConnector();
  }
}

module.exports = new ConnectorRegistry();
