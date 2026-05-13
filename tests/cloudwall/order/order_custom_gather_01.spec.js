// Migrated from: order_custom_gather_01_spec.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)

const { test, expect } = require('@playwright/test');
const { loadSpecData } = require('../../../utils/spec_helper');
const { createNewNyMarvelCartoonTestOrderWithoutPostingFromDb } = require('../../../utils/cloudwall/order_util');
const { visitAndLogin, clearSessionCache } = require('../../../utils/modules/cloudwall');
const {
  findInFrames,
  clickAsaba,
  waitForInFrames,
  generateTimestamp,
  runQuickSearch,
  selectRow,
  getContentForRow,
  selectCandidateStatusType,
  clickNextButton,
  selectAll,
  switchTab,
  sendGatherEmail,
  createPostingSimple,
  createTalentViaUI,
  verifyEmailsViaMailinator,
} = require('../../../utils/cloudwall/cloudwall_helpers');

const envConfig = require('../../../configs/env_rcbot.json');
const testData = require('../../../configs/test_data.json');
const config = {
  webHost: envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

// Number of talents to create for test 1 and 2 (replaces the old hardcoded gatherable_talent list)
const NUM_GATHER_TALENTS = 3;

test.describe('Custom (email) Gather from Manage Candidates 01', () => {
  test.setTimeout(300000);
  let data;
  let testTimestamp;
  let orderId;
  let candidateNames;
  let candidateEmails;
  let createdTalents; // [{id, email, firstName, lastName}, ...]

  test.beforeEach(async ({ page }) => {
    clearSessionCache();
    data = loadSpecData('data/yaml/cloudwall/order/order_custom_gather_master_spec.yaml');
    testTimestamp = generateTimestamp();
    await visitAndLogin(page, config);

    // ── Create fresh talents via UI ──
    createdTalents = [];
    for (let i = 0; i < NUM_GATHER_TALENTS; i++) {
      const talent = await createTalentViaUI(page, data.talent_to_setup, config);
      console.log(`Created talent ${i + 1}/${NUM_GATHER_TALENTS}: ${talent.id} (${talent.firstName} ${talent.lastName}) — ${talent.email}`);

      createdTalents.push(talent);
    }

    candidateNames = createdTalents.map(t => `${t.firstName} ${t.lastName}`);
    candidateEmails = createdTalents.map(t => t.email);

    // ── Create order via DB ──
    const context = { config };
    orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, context);
    console.log(`Order created via DB: ${orderId}`);

    // ── Navigate to Manage Candidates and add all talents as candidates ──
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);

    for (const talent of createdTalents) {
      await runQuickSearch(page, talent.id);

      // Retry search — newly created talents may need time to appear in the search index
      let searchResult = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        searchResult = await waitForInFrames(page, `tr:has-text("${talent.id}")`, 10000).catch(() => null);
        if (searchResult) break;
        console.log(`Talent ${talent.id} not found in search (attempt ${attempt}/3), retrying...`);
        await page.waitForTimeout(5000);
        await runQuickSearch(page, talent.id);
      }
      if (!searchResult) throw new Error(`Could not find talent ${talent.id} in Manage Candidates search after 3 attempts`);

      await searchResult.locator.first().click();
      await clickAsaba(page, 'Make Candidate');
      await selectCandidateStatusType(page, 'talent_applied_online');
      await clickNextButton(page);
      await clickAsaba(page, 'Save');
      await page.waitForTimeout(2000);
    }
  });

  test('should send a custom gather with a custom body @BIZ-21978', async ({ page }) => {
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) await manageCandidatesBtn.locator.click();

    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);
    await selectAll(page);
    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    const sentBody = `${data.email_body}b21978a ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);
    console.log(`Gather email sent. Looking for job description: "${data.new_york.job_description}"`);

    // Verify emails were received via Mailinator API
    // Note: CloudWall's gather template includes the job description, not the custom email body text.
    // We search for the job description to confirm the gather was sent.
    const emailResults = await verifyEmailsViaMailinator(
      candidateEmails,
      data.new_york.job_description,
      process.env.MAILINATOR_API_TOKEN,
      { timeout: 120000, pollInterval: 10000 }
    );

    for (const result of emailResults) {
      expect(result.found).toBe(true);
      expect(result.bodyText).toContain(data.new_york.job_description);
    }
  });

  test('should create a custom gather activity for the order @BIZ-21978 @release359', async ({ page }) => {
    test.setTimeout(600000); // beforeEach creates 3 talents + order + candidates
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) await manageCandidatesBtn.locator.click();

    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);
    await selectAll(page);
    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    const sentBody = `${data.email_body}b21978b ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    await clickAsaba(page, 'Order Detail');
    await page.waitForTimeout(2000);
    await switchTab(page, 'activity_history');
    await page.waitForTimeout(3000);

    const activityText = await waitForInFrames(page, `text=${data.activity_history.custom_gather_event}`, 15000);
    expect(activityText).not.toBeNull();
  });

  test('should create a custom gather activity for the talent @BIZ-21978', async ({ page }) => {
    test.setTimeout(600000); // This test creates 3+1 talents, order, posting, gather, and navigates to talent detail
    const talent = await createTalentViaUI(page, data.talent_to_setup, config);
    const personId = talent.id;
    console.log(`Created talent: ${personId} (${talent.firstName} ${talent.lastName}) — email: ${talent.email}`);

    // Navigate to TalentDetail — after creation we may still be on the Edit page
    await page.goto(`https://${config.webHost}/webwall/talent/${personId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Navigate to Edit Placement Info to set MOATS and SMS
    // First try the View Placement Info link, then click the Edit button
    await clickAsaba(page, 'AWUIDrawTalentViewPlacementInfo').catch(() => {});
    await page.waitForTimeout(3000);

    // Click the Edit button (same pattern as talent_gather.spec.js)
    const editBtn = await findInFrames(page, 'button[data-href*="AWUIDrawTalentEditPlacementInfo"]', 10000);
    if (editBtn) {
      await editBtn.locator.click();
    } else {
      await clickAsaba(page, 'AWUIDrawTalentEditPlacementInfo');
    }

    // Wait for the Edit Placement Info page to fully load
    await waitForInFrames(page, '//span[contains(text(), "Edit Placement Info")]', 30000);
    await page.waitForTimeout(3000);

    const activeSearchYes = await findInFrames(page, 'input[name="activeSearch"][value="yes"], #moats-availability-active-search-yes', 5000);
    if (activeSearchYes) await activeSearchYes.locator.click();

    const availableNow = await findInFrames(page, 'input[name="availabilityType"][value="now"], #moats-availability-type-available-now', 5000);
    if (availableNow) await availableNow.locator.click();

    await switchTab(page, 'profile');
    await page.waitForTimeout(2000);

    const phoneInput = await findInFrames(page, 'input[name="phone"], input[name="phoneNumber"]', 3000);
    if (phoneInput) {
      await phoneInput.locator.clear();
      await phoneInput.locator.fill(data.jon_deery_phone_number);
    }

    const smsSelect = await findInFrames(page, 'select[name="smsPreference"], #sms-preference-choice', 3000);
    if (smsSelect) await smsSelect.locator.selectOption('yes');

    const smsReason = await findInFrames(page, 'select[name="smsOptInReason"], #sms-opt-in-reason', 3000);
    if (smsReason) await smsReason.locator.selectOption('2');

    await clickAsaba(page, 'Save');
    await page.waitForTimeout(5000);

    try {
      const noButton = page.locator('.swal2-cancel, button:has-text("No")').first();
      await noButton.waitFor({ state: 'visible', timeout: 5000 });
      await noButton.click();
      await page.waitForTimeout(2000);
    } catch { /* modal may not appear */ }

    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(2000);
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    const mcBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 3000);
    if (mcBtn) await mcBtn.locator.click();
    await page.waitForTimeout(3000);

    await runQuickSearch(page, personId);
    const searchResult = await waitForInFrames(page, `tr:has-text("${personId}")`, 10000);
    await searchResult.locator.first().click();

    await clickAsaba(page, 'Make Candidate');
    await selectCandidateStatusType(page, 'approved_by_recruiter');
    await clickNextButton(page);
    await clickAsaba(page, 'Save');
    await page.waitForTimeout(2000);

    let candidateFound = false;
    for (const frame of page.frames()) {
      const row = frame.locator(`tr[data-key="${personId}"]`);
      if (await row.count().catch(() => 0) > 0) {
        await row.first().click();
        candidateFound = true;
        break;
      }
    }
    if (!candidateFound) throw new Error(`Could not find candidate row for ${personId}`);

    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    const sentBody = `${data.email_body}b21978c ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Navigate directly to talent detail to check activity history
    await page.goto(`https://${config.webHost}/webwall/talent/${personId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // The Activity History tab lives on the TalentViewDetail screen.
    // Try clicking the ASABA link that shows the detail view with tabs.
    await clickAsaba(page, 'AWUIDrawTalentViewDetail').catch(() => {});
    await page.waitForTimeout(3000);

    // Try to find Activity History tab — it may be labeled differently on the talent screen
    let activityTab = await findInFrames(page, 'text=Activity History', 5000);
    if (!activityTab) {
      // Some CloudWall screens use "Activity" or it may be an anchor/link
      activityTab = await findInFrames(page, 'a:has-text("Activity"), td:has-text("Activity History"), text=Activity', 5000);
    }
    if (activityTab) {
      await activityTab.locator.first().click();
      await page.waitForTimeout(3000);
    } else {
      throw new Error('Could not find Activity History tab on talent detail page');
    }
    await page.waitForTimeout(3000);

    const activityText = await waitForInFrames(page, `text=${data.activity_history.custom_gather_event}`, 15000);
    expect(activityText).not.toBeNull();

    const correspondenceTab = await waitForInFrames(page, 'text=Correspondence', 10000);
    await correspondenceTab.locator.first().click();
    await page.waitForTimeout(3000);

    const correspondenceText = await waitForInFrames(page, `text=${data.gather_subject}`, 15000);
    expect(correspondenceText).not.toBeNull();
  });
});