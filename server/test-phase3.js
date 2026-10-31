/**
 * Phase 3 Automated Test Suite
 * Tests Publishing Connectors, Scheduling, Redaction, Manual Workflow, and Error Handling.
 */

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('--- STARTING PHASE 3 AUTOMATED TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Get Listings & Channels for testing
    console.log('\n--- 1. Fetching Prerequisites ---');
    const listRes = await fetch(`${BASE_URL}/listings`);
    const listingsData = await listRes.json();
    const listing = listingsData.items[0];
    assert(listing && listing.id, 'Found valid listing from Phase 1');

    const chanRes = await fetch(`${BASE_URL}/channels`);
    const chanData = await chanRes.json();
    const channels = chanData.items || chanData;
    const fbPage = channels.find(c => c.channel_type === 'facebook_page');
    const fbGroup = channels.find(c => c.channel_type === 'facebook_group');
    assert(fbPage && fbGroup, 'Found Facebook Page and Facebook Group channels from Phase 2');

    // 2. Connectors API & Secret Redaction Security
    console.log('\n--- 2. Connectors API & Security Redaction ---');
    const connRes = await fetch(`${BASE_URL}/connectors`);
    const connectors = await connRes.json();
    assert(Array.isArray(connectors) && connectors.length >= 3, 'Fetched registered connectors list');
    
    // Check redaction of secrets
    const fbPageConn = connectors.find(c => c.id === 'facebook_page');
    assert(fbPageConn != null, 'Found facebook_page connector');
    if (fbPageConn.config && fbPageConn.config.access_token) {
      assert(
        fbPageConn.config.access_token.startsWith('***CONFIGURED'),
        'Access token is securely REDACTED in API responses'
      );
    } else {
      assert(true, 'Access token is empty/unconfigured (safe)');
    }

    // Test Connector connection validation
    const testRes = await fetch(`${BASE_URL}/connectors/batdongsan_portal/test`, { method: 'POST' });
    const testData = await testRes.json();
    assert(testData.hasOwnProperty('success'), 'Connector test endpoint responds properly');

    // 3. Publishing Tasks Creation & Routing
    console.log('\n--- 3. Task Creation & Multi-channel Routing ---');
    const createRes = await fetch(`${BASE_URL}/publishing/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        channel_ids: [fbPage.id, fbGroup.id],
        action: 'publish_now',
        customizations: {
          [fbPage.id]: {
            title: 'Custom Title for Fanpage',
            description: 'Fanpage custom description',
            contact_info: '0901234567',
            cta: 'Inbox ngay!',
            hashtags: '#test #phase3'
          },
          [fbGroup.id]: {
            title: 'Custom Title for Group',
            description: 'Group custom description',
            contact_info: '0901234567',
            cta: 'Gọi ngay!',
            hashtags: '#group #phase3'
          }
        }
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Tasks created successfully with 201 Created');
    assert(createData.tasks && createData.tasks.length === 2, 'Generated 2 tasks for 2 destinations');

    const createdGroupTask = createData.tasks.find(t => t.channel_type === 'facebook_group');
    assert(
      createdGroupTask && createdGroupTask.status === 'needs_manual_action',
      'Facebook Group task correctly routed to "needs_manual_action" (No fake API claim)'
    );

    // 4. Duplicate Prevention via Idempotency Key
    console.log('\n--- 4. Duplicate Prevention via Idempotency ---');
    const dupRes = await fetch(`${BASE_URL}/publishing/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        channel_ids: [fbPage.id, fbGroup.id],
        action: 'publish_now'
      })
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'Duplicate request within short window correctly blocked with 409 Conflict');

    // 5. Scheduling & Cancellation
    console.log('\n--- 5. Scheduling & Cancellation ---');
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
    const schedRes = await fetch(`${BASE_URL}/publishing/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listing.id,
        channel_ids: [fbPage.id],
        action: 'schedule',
        scheduled_for: futureDate
      })
    });
    const schedData = await schedRes.json();
    assert(schedRes.status === 201, `Scheduled task HTTP status 201 (got ${schedRes.status})`);
    const schedTask = schedData.tasks && schedData.tasks[0];
    assert(schedTask && schedTask.status === 'scheduled', 'Scheduled task created with status "scheduled"');

    // Cancel the scheduled task
    const cancelRes = await fetch(`${BASE_URL}/publishing/tasks/${schedTask.id}/cancel`, { method: 'POST' });
    const cancelData = await cancelRes.json();
    assert(cancelData.task && cancelData.task.status === 'cancelled', 'Scheduled task successfully cancelled');

    // 6. Manual Publishing Guided Workflow Confirmation
    console.log('\n--- 6. Manual Publishing Confirmation Workflow ---');
    const confirmRes = await fetch(`${BASE_URL}/publishing/tasks/${createdGroupTask.id}/confirm-manual`, {
      method: 'POST'
    });
    const confirmData = await confirmRes.json();
    assert(
      confirmData.task && confirmData.task.status === 'published' && confirmData.task.outcome === 'user_confirmed_manual',
      'Manual task marked as published with outcome "user_confirmed_manual"'
    );

    // 7. Retry Mechanism for Failed Tasks
    console.log('\n--- 7. Retry Mechanism ---');
    // Find or create a failed task to test retry
    const tasksRes = await fetch(`${BASE_URL}/publishing/tasks`);
    const tasksJson = await tasksRes.json();
    const allTasks = tasksJson.tasks || tasksJson.items || [];
    let failedTask = allTasks.find(t => t.status === 'failed');

    if (failedTask) {
      const prevRetryCount = failedTask.retry_count || failedTask.attempt_count || 0;
      const retryRes = await fetch(`${BASE_URL}/publishing/tasks/${failedTask.id}/retry`, { method: 'POST' });
      const retryData = await retryRes.json();
      assert(
        retryData.task && ((retryData.task.retry_count || retryData.task.attempt_count) === prevRetryCount + 1),
        'Failed task retry incremented retry_count'
      );
    } else {
      console.log('ℹ️ No pre-existing failed task, testing retry endpoint on an invalid task');
      const retryRes = await fetch(`${BASE_URL}/publishing/tasks/non-existent/retry`, { method: 'POST' });
      assert(retryRes.status === 404, 'Retry on non-existent task returns 404');
    }

    // 8. Stats & Filtering Endpoint Verification
    console.log('\n--- 8. Stats & Filtering Verification ---');
    const statsRes = await fetch(`${BASE_URL}/publishing/stats`);
    const stats = await statsRes.json();
    assert(stats.total > 0, 'Publishing stats endpoint returns total count > 0');
    assert(typeof stats.published === 'number', 'Stats contains published count');
    assert(typeof stats.scheduled === 'number', 'Stats contains scheduled count');
    assert(typeof stats.needs_manual === 'number', 'Stats contains needs_manual count');

    const filterRes = await fetch(`${BASE_URL}/publishing/tasks?status=published`);
    const filteredTasks = await filterRes.json();
    const allPublished = filteredTasks.tasks.every(t => t.status === 'published');
    assert(allPublished, 'Filter by status=published returns only published tasks');

  } catch (err) {
    console.error('Fatal Test Exception:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

runTests();
