const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'realestate.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL,
    listing_action TEXT DEFAULT 'ban',
    province TEXT,
    district TEXT,
    ward TEXT,
    address_detail TEXT,
    price REAL,
    price_unit TEXT DEFAULT 'tỷ',
    price_raw_text TEXT,
    area REAL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    floors INTEGER,
    direction TEXT,
    legal_status TEXT,
    furniture_status TEXT,
    amenities TEXT DEFAULT '[]',
    contact_name TEXT,
    contact_phone TEXT,
    contact_zalo TEXT,
    contact_note TEXT,
    map_url TEXT,
    detail_url TEXT,
    status TEXT DEFAULT 'draft',
    photos TEXT DEFAULT '[]',
    target_platforms TEXT DEFAULT '[]',
    target_groups TEXT DEFAULT '[]',
    scheduled_at TEXT,
    publish_queue_status TEXT DEFAULT 'idle',
    publish_logs TEXT DEFAULT '[]',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    style TEXT DEFAULT 'chuyen_nghiep',
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    listing_id TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    category TEXT DEFAULT 'bat_dong_san',
    province TEXT,
    district TEXT,
    ward TEXT,
    property_types TEXT DEFAULT '[]',
    price_segments TEXT DEFAULT '[]',
    target_audiences TEXT DEFAULT '[]',
    source TEXT DEFAULT 'manual',
    verification_status TEXT DEFAULT 'unverified',
    last_verified_at TEXT,
    publishing_capability TEXT DEFAULT 'unknown',
    is_favorite INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS channel_collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'emerald',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS channel_collection_items (
    collection_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    added_at TEXT,
    PRIMARY KEY (collection_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS score_settings (
    id TEXT PRIMARY KEY,
    weight_location INTEGER DEFAULT 25,
    weight_property_type INTEGER DEFAULT 20,
    weight_price INTEGER DEFAULT 15,
    weight_audience INTEGER DEFAULT 15,
    weight_freshness INTEGER DEFAULT 15,
    weight_capability INTEGER DEFAULT 10,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS publishing_tasks (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    title TEXT,
    content TEXT,
    media_urls TEXT DEFAULT '[]',
    contact_info TEXT DEFAULT '{}',
    cta_type TEXT DEFAULT 'call_now',
    cta_link TEXT,
    hashtags TEXT DEFAULT '',
    scheduled_at TEXT,
    started_at TEXT,
    completed_at TEXT,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    platform_post_id TEXT,
    published_url TEXT,
    error_code TEXT,
    error_message TEXT,
    outcome_type TEXT DEFAULT 'unknown',
    idempotency_key TEXT UNIQUE,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS connector_credentials (
    id TEXT PRIMARY KEY,
    connector_type TEXT NOT NULL,
    account_name TEXT NOT NULL,
    app_id TEXT,
    access_token TEXT,
    page_id TEXT,
    api_endpoint TEXT,
    is_active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'not_configured',
    last_validated_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  -- PHASE 4 TABLES --
  CREATE TABLE IF NOT EXISTS post_analytics (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    listing_id TEXT,
    channel_id TEXT,
    views INTEGER DEFAULT 0,
    interactions INTEGER DEFAULT 0,
    leads_count INTEGER DEFAULT 0,
    data_source TEXT DEFAULT 'manual', -- 'platform' | 'manual' | 'unavailable'
    notes TEXT,
    recorded_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    zalo TEXT,
    source_channel_id TEXT,
    source_platform TEXT,
    listing_id TEXT,
    property_type_interest TEXT,
    location_interest TEXT,
    budget_min REAL,
    budget_max REAL,
    budget_text TEXT,
    status TEXT DEFAULT 'new', -- 'new' | 'contacting' | 'consulting' | 'scheduled_viewing' | 'deal_won' | 'deal_lost'
    notes TEXT,
    next_followup_at TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lead_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- 'call' | 'message' | 'meeting' | 'note' | 'status_change'
    summary TEXT NOT NULL,
    details TEXT,
    performed_at TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL, -- 'listing_approved' | 'publish_failed' | 'manual_action_needed' | 'duplicate_detected' | 'listing_expiring' | 'analytics_updated'
    conditions TEXT DEFAULT '{}',
    actions TEXT DEFAULT '{}',
    is_enabled INTEGER DEFAULT 1,
    last_triggered_at TEXT,
    execution_count INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS automation_rule_logs (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    trigger_event TEXT,
    status TEXT, -- 'success' | 'failed' | 'skipped'
    message TEXT,
    context_data TEXT DEFAULT '{}',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS system_audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'listing' | 'channel' | 'task' | 'connector' | 'lead' | 'rule' | 'ai'
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    provider TEXT DEFAULT 'openai', -- 'openai' | 'gemini' | 'claude' | 'local_assistant'
    api_key TEXT,
    model_name TEXT DEFAULT 'gpt-4o-mini',
    temperature REAL DEFAULT 0.7,
    custom_endpoint TEXT,
    is_configured INTEGER DEFAULT 0,
    updated_at TEXT
  );

  -- MASTER REFACTOR EXTENSION TABLES --
  CREATE TABLE IF NOT EXISTS location_reference_projects (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    aliases TEXT DEFAULT '[]',
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    ward TEXT,
    expected_property_types TEXT DEFAULT '[]',
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS publishing_execution_logs (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    worker_name TEXT,
    action TEXT,
    status TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    details TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS account_sessions (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    connection_name TEXT NOT NULL,
    account_id TEXT,
    auth_method TEXT DEFAULT 'oauth',
    connection_status TEXT DEFAULT 'CONNECTED',
    granted_permissions TEXT DEFAULT '[]',
    missing_permissions TEXT DEFAULT '[]',
    token_masked TEXT,
    token_expires_at TEXT,
    last_verified_at TEXT,
    error_history TEXT DEFAULT '[]',
    created_at TEXT,
    updated_at TEXT
  );
`);

// Safe column migration helper
function ensureColumn(table, colName, colDefinition) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some(c => c.name === colName)) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDefinition}`).run();
    }
  } catch (err) {
    console.error(`Migration error adding ${colName} to ${table}:`, err.message);
  }
}

// Master refactor column migrations
ensureColumn('listings', 'project_name', "TEXT");
ensureColumn('listings', 'location_verification_status', "TEXT DEFAULT 'UNVERIFIED'");
ensureColumn('listings', 'location_mismatch_details', "TEXT");
ensureColumn('listings', 'lat', "REAL");
ensureColumn('listings', 'lng', "REAL");
ensureColumn('listings', 'verification_source', "TEXT");
ensureColumn('listings', 'verified_at', "TEXT");
ensureColumn('listings', 'approved_photo_ids', "TEXT DEFAULT '[]'");
ensureColumn('listings', 'content_versions', "TEXT DEFAULT '[]'");

ensureColumn('channels', 'health_score', "REAL DEFAULT 0");
ensureColumn('channels', 'health_confidence', "TEXT DEFAULT 'INSUFFICIENT_DATA'");
ensureColumn('channels', 'health_breakdown', "TEXT DEFAULT '{}'");
ensureColumn('channels', 'approval_type', "TEXT DEFAULT 'unverified'");
ensureColumn('channels', 'observed_stats', "TEXT DEFAULT '{}'");

ensureColumn('publishing_tasks', 'approved_photo_ids', "TEXT DEFAULT '[]'");
ensureColumn('publishing_tasks', 'location_verification_status', "TEXT DEFAULT 'UNVERIFIED'");
ensureColumn('publishing_tasks', 'worker_state', "TEXT DEFAULT 'PENDING'");
ensureColumn('publishing_tasks', 'account_session_id', "TEXT");
ensureColumn('publishing_tasks', 'approved_content_version', "TEXT DEFAULT 'v1'");
ensureColumn('publishing_tasks', 'scheduled_at_tz', "TEXT DEFAULT 'Asia/Ho_Chi_Minh'");
ensureColumn('publishing_tasks', 'error_category', "TEXT");
ensureColumn('publishing_tasks', 'retry_eligible', "INTEGER DEFAULT 1");
ensureColumn('publishing_tasks', 'raw_connector_response', "TEXT DEFAULT '{}'");

ensureColumn('account_sessions', 'access_token', "TEXT");
ensureColumn('account_sessions', 'cookies', "TEXT");
ensureColumn('account_sessions', 'last_error', "TEXT");
ensureColumn('account_sessions', 'pages_discovered', "TEXT DEFAULT '[]'");
ensureColumn('account_sessions', 'meta_app_id', "TEXT");
ensureColumn('account_sessions', 'avatar_url', "TEXT");

ensureColumn('TargetGroups', 'target_district', "TEXT");
ensureColumn('TargetGroups', 'is_active', "INTEGER DEFAULT 1");
ensureColumn('PostingSchedules', 'target_time_slot', "TEXT");
ensureColumn('PostingSchedules', 'jitter_offset_minutes', "INTEGER DEFAULT 0");
ensureColumn('PostingSchedules', 'opening_hook', "TEXT");
ensureColumn('PostingSchedules', 'spun_content', "TEXT");

db.exec(`
  CREATE TABLE IF NOT EXISTS facebook_oauth_states (
    state TEXT PRIMARY KEY,
    created_at TEXT,
    redirect_uri TEXT,
    expires_at TEXT
  );

  -- ==========================================================
  -- GIAI ĐOẠN 1: 4 BẢNG CỐT LÕI (UTF-8 / NVARCHAR Persistent)
  -- ==========================================================
  CREATE TABLE IF NOT EXISTS Properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    raw_content TEXT,
    price REAL,
    area REAL,
    city TEXT,
    district TEXT,
    ward TEXT,
    property_type TEXT,
    extracted_tags TEXT DEFAULT '[]',
    status TEXT DEFAULT 'draft',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS MediaAssets (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    detected_category TEXT DEFAULT 'living_room',
    aesthetic_score REAL DEFAULT 8.5,
    relevance_score REAL DEFAULT 9.0,
    is_selected INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS TargetGroups (
    id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    group_url TEXT NOT NULL,
    target_city TEXT,
    target_property_type TEXT,
    active_score REAL DEFAULT 80,
    approval_latency_minutes INTEGER DEFAULT 15,
    trained_time_slots TEXT DEFAULT '["08:30", "11:45", "20:00"]',
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS PostingSchedules (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    selected_media_ids TEXT DEFAULT '[]',
    scheduled_time TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    published_url TEXT,
    error_log TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS publishing_batches (
    id TEXT PRIMARY KEY,
    total_groups INTEGER DEFAULT 0,
    completed_groups INTEGER DEFAULT 0,
    failed_groups INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'paused' | 'stopped'
    delay_min INTEGER DEFAULT 90,
    delay_max INTEGER DEFAULT 180,
    auto_spin INTEGER DEFAULT 1,
    current_index INTEGER DEFAULT 0,
    current_group_url TEXT,
    current_step TEXT,
    error_message TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS publishing_batch_items (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    group_url TEXT NOT NULL,
    group_name TEXT,
    content TEXT,
    spun_content TEXT,
    images TEXT DEFAULT '[]',
    status TEXT DEFAULT 'pending', -- 'pending' | 'posting' | 'success' | 'failed' | 'skipped'
    delay_seconds INTEGER DEFAULT 0,
    error_message TEXT,
    published_url TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT
  );
`);

// Initialize default AI Settings with GROQ_API_KEY if not present
const aiSetting = db.prepare("SELECT * FROM ai_settings WHERE id = 'default'").get();
if (!aiSetting) {
  db.prepare(`
    INSERT INTO ai_settings (id, provider, api_key, model_name, temperature, custom_endpoint, is_configured, updated_at)
    VALUES ('default', 'groq', ?, 'llama-3.3-70b-versatile', 0.2, '', 1, datetime('now'))
  `).run(process.env.GROQ_API_KEY || '');
} else if (!aiSetting.api_key && process.env.GROQ_API_KEY) {
  db.prepare("UPDATE ai_settings SET api_key = ?, provider = 'groq', is_configured = 1 WHERE id = 'default'").run(process.env.GROQ_API_KEY);
}

module.exports = db;
