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
} = require('../../../utils/cloudwall/cloudwall_helpers');

const envConfig = require('../../../configs/env_rcbot.json');
const testData = require('../../../configs/test_data.json');
const config = {
  webHost: envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

test.describe('Custom (email) Gather from Manage Candidates 01', () => {
  test.setTimeout(300000);
  let data;
  let testTimestamp;
  let orderId;
  let candidateNames;
  let candidateEmails;

  test.beforeEach(async ({ page }) => {
    clearSessionCache();
    data = loadSpecData('data/yaml/cloudwall/order/order_custom_gather_master_spec.yaml');
    testTimestamp = generateTimestamp();
    await visitAndLogin(page, config);

    const context = { config };
    orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, context);
    console.log(`Order created via DB: ${orderId}`);

    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);

    candidateNames = [];
    candidateEmails = [];

    for (const personId of data.gatherable_talent) {
      await runQuickSearch(page, personId);
      await selectRow(page, personId);
      const rowContents = await getContentForRow(page, personId);
      candidateNames.push(`${rowContents.firstName} ${rowContents.lastName}`);
      candidateEmails.push(rowContents.email);
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

    const MAILINATOR_API_TOKEN = '44315acbe70d47e79e36d5b73fbe1748';
    const domain = 'muukteam.testinator.com';
    const inbox = 'aquent';
    const deadline = Date.now() + 60000;
    let emailFound = false;

    while (Date.now() < deadline && !emailFound) {
      try {
        const inboxResponse = await fetch(
          `https://mailinator.com/api/v2/domains/${domain}/inboxes/${inbox}`,
          { headers: { 'Authorization': MAILINATOR_API_TOKEN } }
        );
        const inboxData = await inboxResponse.json();
        if (inboxData.msgs && inboxData.msgs.length > 0) {
          const sortedMsgs = inboxData.msgs.sort((a, b) => b.time - a.time);
          for (const msg of sortedMsgs) {
            const msgResponse = await fetch(
              `https://mailinator.com/api/v2/domains/${domain}/inboxes/${inbox}/messages/${msg.id}`,
              { headers: { 'Authorization': MAILINATOR_API_TOKEN } }
            );
            const msgData = await msgResponse.json();
            const parts = msgData.parts || [];
            let fullBody = '';
            for (const part of parts) { fullBody += part.body || ''; }
            if (fullBody.includes(sentBody)) {
              expect(fullBody).toContain(data.new_york.job_description);
              emailFound = true;
              break;
            }
          }
        }
      } catch (err) {
        console.log(`Mailinator API error: ${err.message}`);
      }
      if (!emailFound) {
        console.log('Waiting for gather email...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    expect(emailFound).toBe(true);
  });

  test('should create a custom gather activity for the order @BIZ-21978 @release359', async ({ page }) => {
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
    const talent = await createTalentViaUI(page, data.talent_to_setup, config);
    const personId = talent.id;
    console.log(`Created talent: ${personId} (${talent.firstName} ${talent.lastName}) — email: ${talent.email}`);

    await clickAsaba(page, 'AWUIDrawTalentViewPlacementInfo');
    await page.waitForTimeout(2000);
    await clickAsaba(page, 'AWUIDrawTalentEditPlacementInfo');
    await page.waitForTimeout(2000);

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

    let talentFound = false;
    for (const frame of page.frames()) {
      const talentRow = frame.locator(`tr[data-key="${personId}"]`);
      if (await talentRow.count().catch(() => 0) > 0) {
        await talentRow.first().dblclick();
        talentFound = true;
        break;
      }
    }
    if (!talentFound) throw new Error(`Could not find talent row for ${personId}`);

    await page.waitForTimeout(5000);
    await switchTab(page, 'activity_history');
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
