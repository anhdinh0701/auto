const db = require('./db');
const key = process.env.GROQ_API_KEY || '';

db.prepare(`
  INSERT OR REPLACE INTO ai_settings (id, provider, api_key, model_name, temperature, is_configured, updated_at)
  VALUES ('default', 'groq', ?, 'openai/gpt-oss-120b', 0.7, 1, ?)
`).run(key, new Date().toISOString());

console.log('AI Settings updated successfully:', db.prepare('SELECT id, provider, model_name, is_configured FROM ai_settings').get());
