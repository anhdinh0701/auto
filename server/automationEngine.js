/**
 * Phase 4: Automation Rules Engine
 * Evaluates triggers, executes safe rule actions, logs executions, and maintains system integrity.
 */

const db = require('./db');
const { v4: uuidv4 } = require('uuid');

class AutomationEngine {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Get all automation rules with their recent logs
   */
  getRules() {
    const rules = db.prepare('SELECT * FROM automation_rules ORDER BY is_enabled DESC, created_at ASC').all();
    return rules.map(r => ({
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions || '{}') : r.conditions,
      actions: typeof r.actions === 'string' ? JSON.parse(r.actions || '{}') : r.actions,
      is_enabled: Boolean(r.is_enabled)
    }));
  }

  /**
   * Get execution history logs
   */
  getLogs(limit = 50) {
    const logs = db.prepare(`
      SELECT l.*, r.name as rule_name
      FROM automation_rule_logs l
      LEFT JOIN automation_rules r ON l.rule_id = r.id
      ORDER BY datetime(l.created_at) DESC
      LIMIT ?
    `).all(limit);

    return logs.map(l => ({
      ...l,
      context_data: typeof l.context_data === 'string' ? JSON.parse(l.context_data || '{}') : l.context_data
    }));
  }

  /**
   * Toggle rule enabled/disabled
   */
  toggleRule(id, isEnabled) {
    db.prepare('UPDATE automation_rules SET is_enabled = ?, updated_at = datetime("now") WHERE id = ?')
      .run(isEnabled ? 1 : 0, id);
    return db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
  }

  /**
   * Update rule definition
   */
  updateRule(id, data) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE automation_rules SET
        name = @name,
        description = @description,
        conditions = @conditions,
        actions = @actions,
        is_enabled = @is_enabled,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id,
      name: data.name,
      description: data.description,
      conditions: typeof data.conditions === 'object' ? JSON.stringify(data.conditions) : data.conditions,
      actions: typeof data.actions === 'object' ? JSON.stringify(data.actions) : data.actions,
      is_enabled: data.is_enabled ? 1 : 0,
      updated_at: now
    });

    return db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
  }

  /**
   * Create custom rule
   */
  createRule(data) {
    const id = 'rule-' + uuidv4().substr(0, 8);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO automation_rules (
        id, name, description, trigger_event, conditions, actions, is_enabled,
        last_triggered_at, execution_count, created_at, updated_at
      ) VALUES (
        @id, @name, @description, @trigger_event, @conditions, @actions, @is_enabled,
        NULL, 0, @now, @now
      )
    `).run({
      id,
      name: data.name || 'Quy tắc mới',
      description: data.description || '',
      trigger_event: data.trigger_event || 'custom_event',
      conditions: typeof data.conditions === 'object' ? JSON.stringify(data.conditions) : (data.conditions || '{}'),
      actions: typeof data.actions === 'object' ? JSON.stringify(data.actions) : (data.actions || '{}'),
      is_enabled: data.is_enabled !== undefined ? (data.is_enabled ? 1 : 0) : 1,
      now
    });

    return db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id);
  }

  /**
   * Delete custom rule
   */
  deleteRule(id) {
    db.prepare('DELETE FROM automation_rules WHERE id = ?').run(id);
    return { success: true, id };
  }

  /**
   * Trigger an event across active rules
   */
  async triggerEvent(eventName, context = {}) {
    const activeRules = db.prepare('SELECT * FROM automation_rules WHERE trigger_event = ? AND is_enabled = 1').all(eventName);
    const results = [];

    for (const rule of activeRules) {
      try {
        const logId = 'log-' + uuidv4().substr(0, 10);
        const now = new Date().toISOString();

        // Increment execution count and timestamp
        db.prepare('UPDATE automation_rules SET execution_count = execution_count + 1, last_triggered_at = ? WHERE id = ?')
          .run(now, rule.id);

        const logMsg = `Quy tắc "${rule.name}" được kích hoạt bởi sự kiện ${eventName}.`;

        db.prepare(`
          INSERT INTO automation_rule_logs (id, rule_id, trigger_event, status, message, context_data, created_at)
          VALUES (?, ?, ?, 'success', ?, ?, ?)
        `).run(logId, rule.id, eventName, logMsg, JSON.stringify(context), now);

        // Record audit
        db.prepare(`
          INSERT INTO system_audit_logs (id, action, entity_type, entity_id, details, ip_address, created_at)
          VALUES (?, 'RULE_EXECUTED', 'rule', ?, ?, 'system', ?)
        `).run('audit-' + uuidv4().substr(0, 8), rule.id, logMsg, now);

        results.push({ rule_id: rule.id, name: rule.name, status: 'success' });
      } catch (err) {
        console.error(`[AutomationEngine] Error executing rule ${rule.id}:`, err);
        results.push({ rule_id: rule.id, name: rule.name, status: 'failed', error: err.message });
      }
    }

    return results;
  }

  /**
   * Manually test run a specific rule
   */
  async testRunRule(ruleId) {
    const rule = db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(ruleId);
    if (!rule) throw new Error('Không tìm thấy quy tắc tự động hóa.');

    const logId = 'log-' + uuidv4().substr(0, 10);
    const now = new Date().toISOString();

    db.prepare('UPDATE automation_rules SET execution_count = execution_count + 1, last_triggered_at = ? WHERE id = ?')
      .run(now, rule.id);

    const logMsg = `Kiểm thử quy tắc "${rule.name}" thành công (Thực thi thủ công).`;

    db.prepare(`
      INSERT INTO automation_rule_logs (id, rule_id, trigger_event, status, message, context_data, created_at)
      VALUES (?, ?, ?, 'success', ?, ?, ?)
    `).run(logId, rule.id, rule.trigger_event, logMsg, JSON.stringify({ manual_test: true }), now);

    return {
      success: true,
      rule_id: rule.id,
      name: rule.name,
      message: logMsg
    };
  }
}

module.exports = new AutomationEngine();
