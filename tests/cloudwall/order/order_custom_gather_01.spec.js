// Migrated from: order_custom_gather_01_spec.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)
//
// Order creation uses the DB (tad_create_order_without_posting stored procedure),
// matching the original Ruby approach. Tests 1-2 use pre-existing gatherable talent.
// Test 3 creates a fresh talent via the UI (createTalentViaUI).

const { test, expect } = require('@playwright/test');
const { loadSpecData } = require('../../../utils/spec_helper');
const { createNewNyMarvelCartoonTestOrderWithoutPostingFromDb } = require('../../../utils/cloudwall/order_util');
const { visitAndLogin, clearSessionCache } = require('../../../utils/modules/cloudwall');
const {
  findInFrames,
  clickAsaba,
  clickInFrames,
  waitForInFrames,
  generateTimestamp,
  runQuickSearch,
  selectRow,
  getContentForRow,
  selectCandidateStatusType,
  clickNextButton,
  selectAll,
  switchTab,
  typeInEditor,
  selectDefaultGatherTemplate,
  sendGatherEmail,
  createPostingSimple,
  createTalentViaUI,
  generateRandomTalent,
  verifyEmailsViaMailinator,
} = require('../../../utils/cloudwall/cloudwall_helpers');

// Load environment config and credentials
const envConfig = require('../../../configs/env_rcbot.json');
const testData = require('../../../configs/test_data.json');
const config = {
  webHost: envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Custom (email) Gather from Manage Candidates 01', () => {
  test.setTimeout(300000); // 5 min — order creation + candidate setup + email polling
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

    // Create order via DB (mirrors Ruby: create_new_ny_marvel_cartoon_test_order_without_posting_from_db)
    const context = { config };
    orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, context);
    console.log(`Order created via DB: ${orderId}`);

    // Navigate to the order and open Manage Candidates (mirrors Ruby: open_order; click_asaba 'AWUIDrawManageCandidates')
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);

    candidateNames = [];
    candidateEmails = [];

    // Add gatherable talent as candidates (mirrors Ruby: @data['gatherable_talent'].each)
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

  // ---------------------------------------------------------------------------
  // Test 1: should send a custom gather with a custom body (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('should send a custom gather with a custom body @BIZ-21978', async ({ page }) => {
    // Create a posting for the order
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) {
      await manageCandidatesBtn.locator.click();
    }

    // Wait for candidates table to load
    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Select all candidates
    await selectAll(page);

    // Click Message to open email compose form
    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    // Send gather email
    const sentBody = `${data.email_body}b21978a ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    // Verify emails were received via Mailinator API
    // Ruby original: emails = search_for_emails({body: sent_body}, {data: true, wait: 60, size: @candidate_names.size})
    const emailResults = await verifyEmailsViaMailinator(
      candidateEmails,
      sentBody,
      process.env.MAILINATOR_API_TOKEN,
      { timeout: 60000, pollInterval: 10000 }
    );

    for (const result of emailResults) {
      expect(result.found).toBe(true);
      expect(result.bodyText).toContain(data.new_york.job_description);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2: should create a custom gather activity for the order (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('should create a custom gather activity for the order @BIZ-21978 @release359', async ({ page }) => {
    // Create a posting for the new order
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // Navigate back to Manage Candidates
    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) {
      await manageCandidatesBtn.locator.click();
    }

    // Wait for candidates table to load
    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    await selectAll(page);
    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    const sentBody = `${data.email_body}b21978b ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    // Navigate back to Order Detail
    await clickAsaba(page, 'Order Detail');
    await page.waitForTimeout(2000);

    // Switch to Activity History tab
    await switchTab(page, 'activity_history');
    await page.waitForTimeout(3000);

    // The activity history is inside an iframe — search its content
    const activityText = await waitForInFrames(page, `text=${data.activity_history.custom_gather_event}`, 15000);
    expect(activityText).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Test 3: should create a custom gather activity for the talent (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('should create a custom gather activity for the talent @BIZ-21978', async ({ page }) => {
    // ── Create talent via UI (mirrors Ruby: person_id = create_talent(@data['talent_to_setup'])) ──
    const talent = await createTalentViaUI(page, data.talent_to_setup, config);
    const personId = talent.id;
    console.log(`Created talent: ${personId} (${talent.firstName} ${talent.lastName}) — email: ${talent.email}`);

    // ── Update talent to be gatherable (mirrors Ruby: moats availability, phone, SMS settings) ──
    await clickAsaba(page, 'AWUIDrawTalentViewPlacementInfo');
    await page.waitForTimeout(2000);
    await clickAsaba(page, 'AWUIDrawTalentEditPlacementInfo');
    await page.waitForTimeout(2000);

    // Set MOATS availability to Active Search / Available Now
    const activeSearchYes = await findInFrames(page, 'input[name="activeSearch"][value="yes"], #moats-availability-active-search-yes', 5000);
    if (activeSearchYes) await activeSearchYes.locator.click();

    const availableNow = await findInFrames(page, 'input[name="availabilityType"][value="now"], #moats-availability-type-available-now', 5000);
    if (availableNow) await availableNow.locator.click();

    // Switch to Profile tab to set phone and SMS
    await switchTab(page, 'profile');
    await page.waitForTimeout(2000);

    // Delete existing phone numbers
    for (const frame of page.frames()) {
      const trashButtons = frame.locator('.phone-trash, .deletePhone');
      const count = await trashButtons.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        if (await trashButtons.nth(i).isVisible().catch(() => false)) {
          await trashButtons.nth(i).click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Set phone number (Jon Deery's number from YAML)
    const phoneInput = await findInFrames(page, 'input[name="phone"], input[name="phoneNumber"]', 3000);
    if (phoneInput) {
      await phoneInput.locator.clear();
      await phoneInput.locator.fill(data.jon_deery_phone_number);
    } else {
      // Click "Add Phone" if phone field isn't visible
      const addPhoneLink = await findInFrames(page, 'a:has-text("Add Phone")', 3000);
      if (addPhoneLink) {
        await addPhoneLink.locator.click();
        await page.waitForTimeout(1000);
        const newPhoneInput = await findInFrames(page, 'input[name="phone"], input[name="phoneNumber"]', 3000);
        if (newPhoneInput) {
          await newPhoneInput.locator.clear();
          await newPhoneInput.locator.fill(data.jon_deery_phone_number);
        }
      }
    }

    // Set SMS preference to 'yes'
    const smsSelect = await findInFrames(page, 'select[name="smsPreference"], #sms-preference-choice', 3000);
    if (smsSelect) await smsSelect.locator.selectOption('yes');

    // Set SMS opt-in reason
    const smsReason = await findInFrames(page, 'select[name="smsOptInReason"], #sms-opt-in-reason', 3000);
    if (smsReason) await smsReason.locator.selectOption('2');

    // Save
    await clickAsaba(page, 'Save');
    await page.waitForTimeout(5000);

    // Dismiss MAT modal if it appears
    try {
      const noButton = page.locator('.swal2-cancel, button:has-text("No")').first();
      await noButton.waitFor({ state: 'visible', timeout: 5000 });
      await noButton.click();
      await page.waitForTimeout(2000);
    } catch { /* modal may not appear */ }

    // ── Navigate back to order (mirrors Ruby: top_page.open_module :order) ──
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Open Manage Candidates and create posting
    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(2000);
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // Navigate back to Manage Candidates
    const mcBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 3000);
    if (mcBtn) await mcBtn.locator.click();
    await page.waitForTimeout(3000);

    // ── Add new talent as candidate (mirrors Ruby: main_page.run_quick_search person_id; makeCandidate) ──
    await runQuickSearch(page, personId);
    const searchResult = await waitForInFrames(page, `tr:has-text("${personId}")`, 10000);
    await searchResult.locator.first().click();

    await clickAsaba(page, 'Make Candidate');
    await selectCandidateStatusType(page, 'approved_by_recruiter');
    await clickNextButton(page);
    await clickAsaba(page, 'Save');
    await page.waitForTimeout(2000);

    // ── Select candidate and send gather email ──
    // Select the candidate row in current candidates
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

    // ── Verify activity history on the talent ──
    // Double-click candidate row to open TalentDetail (mirrors Ruby: current_candidates.double_click_row person_id)
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

    // Switch to Activity History tab (mirrors Ruby: main_page.switch_tab :activity_history)
    await switchTab(page, 'activity_history');
    await page.waitForTimeout(3000);

    const activityText = await waitForInFrames(page, `text=${data.activity_history.custom_gather_event}`, 15000);
    expect(activityText).not.toBeNull();

    // ── Verify correspondence (mirrors Ruby: main_page.click(:activity_history, :correspondence_tab_button)) ──
    const correspondenceTab = await waitForInFrames(page, 'text=Correspondence', 10000);
    await correspondenceTab.locator.first().click();
    await page.waitForTimeout(3000);

    const correspondenceText = await waitForInFrames(page, `text=${data.gather_subject}`, 15000);
    expect(correspondenceText).not.toBeNull();
  });
});