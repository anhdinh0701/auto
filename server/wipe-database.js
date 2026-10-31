const db = require('./db');

const tablesToClear = [
  'Properties',
  'MediaAssets',
  'TargetGroups',
  'PostingSchedules',
  'listings',
  'photos',
  'publishing_tasks',
  'publishing_execution_logs',
  'channels',
  'channel_collections',
  'channel_collection_items',
  'leads',
  'lead_activities',
  'post_analytics',
  'automation_rules',
  'system_audit_logs',
  'account_sessions',
  'templates'
];

console.log('--- Wiping all tables to zero records ---');
for (const table of tablesToClear) {
  try {
    db.prepare(`DELETE FROM ${table}`).run();
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
    console.log(`Table ${table}: ${count} records (CLEANED)`);
  } catch (err) {
    console.warn(`Could not clear table ${table}:`, err.message);
  }
}

console.log('\n--- Verification of 0 Records ---');
const propCount = db.prepare('SELECT COUNT(*) as c FROM Properties').get().c;
const listCount = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
const schedCount = db.prepare('SELECT COUNT(*) as c FROM PostingSchedules').get().c;
const mediaCount = db.prepare('SELECT COUNT(*) as c FROM MediaAssets').get().c;
const taskCount = db.prepare('SELECT COUNT(*) as c FROM publishing_tasks').get().c;

console.log(`Properties: ${propCount}`);
console.log(`Listings: ${listCount}`);
console.log(`PostingSchedules: ${schedCount}`);
console.log(`MediaAssets: ${mediaCount}`);
console.log(`Publishing Tasks: ${taskCount}`);

if (propCount === 0 && listCount === 0 && schedCount === 0 && mediaCount === 0 && taskCount === 0) {
  console.log('\n>>> DATABASE WIPE 100% SUCCESSFUL: TRẮNG HOÀN TOÀN (CON SỐ 0)! <<<');
} else {
  console.error('\n>>> ERROR: Database still contains records! <<<');
  process.exit(1);
}
