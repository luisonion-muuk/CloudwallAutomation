// Migrated from: order_custom_gather_02_spec.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)

const { test, expect } = require('@playwright/test');
const { loadSpecData } = require('../../../utils/spec_helper');
const { createNewNyMarvelCartoonTestOrderWithoutPostingFromDb } = require('../../../utils/cloudwall/order_util');
const { searchForEmails, createEmailSearchString } = require('../../../utils/email_util');
const { visitAndLogin } = require('../../../utils/modules/cloudwall');
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
  createOrderSimple,
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
// Helper: try to navigate to message candidate iframe URL (up to 5 attempts)
// TODO: would be better to dive into iframe rather than grab url and redirect
// ──────────────────────────────────────────────────────────────────────────────
async function tryTargetIframe(page, url, attempt = 1) {
  if (attempt > 5) {
    throw new Error('Could not target message candidate frame');
  }
  await page.goto(url);
  await page.waitForTimeout(2000);

  // Check if the email candidate page loaded by looking for a known element
  const recipientsField = await findInFrames(page, '[data-locator="recipients"], .recipients, #recipients', 3000);
  if (!recipientsField) {
    await page.waitForTimeout(1000);
    await tryTargetIframe(page, url, attempt + 1);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Custom (email) Gather from Manage Candidates 02', () => {
  test.setTimeout(180000); // Increased to 3 min to accommodate order creation
  let data;
  let orderUtilData;
  let testTimestamp;
  let orderId;
  let candidateNames;
  let candidateEmails;

  test.beforeEach(async ({ page }) => {
    data = loadSpecData('data/yaml/cloudwall/order/order_custom_gather_master_spec.yaml');
    orderUtilData = loadSpecData('data/yaml/utils/order_util.yaml');
    testTimestamp = generateTimestamp();

    await visitAndLogin(page, config);

    // Create a new order via the UI
    orderId = await createOrderSimple(page, orderUtilData.new_york, orderUtilData, config);

    // TODO: Alternative — create order via DB when VPN/network is resolved:
    // orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, { config });

    // TODO: Fallback — use hardcoded order ID if both UI and DB creation fail:
    // orderId = '903554';

    // Navigate to the order and open Manage Candidates
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);

    candidateNames = [];
    candidateEmails = [];

    // Due to gather restrictions, we should use pre-selected talent whom we know are gatherable instead of randos
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
  // Test 1: should change the talent's candidate status after send (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('should change the talent\'s candidate status after send @BIZ-21978', async ({ page }) => {
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
    const sentBody = `${data.email_body}b21978d ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    // Verify candidate statuses changed to "gather sent"
    await page.waitForTimeout(3000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Check each candidate row for the expected status
    for (const personId of data.gatherable_talent) {
      const statusCell = await waitForInFrames(page, `tr[data-key="${personId}"] td.candidateStatus, tr[data-key="${personId}"] .status`, 10000);
      expect(statusCell).not.toBeNull();
      const statusText = await statusCell.locator.textContent();
      expect(statusText.trim()).toBe(data.candidate_status_gather_sent);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 2: modal should show up and redirect to MC when agent tries to send
  //         a message to an ineligible talent (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('modal should show up and redirect to MC when agent tries to send a message to an ineligible talent @BIZ-21978', async ({ page }) => {
    // Create a posting for the order
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // Navigate back to Manage Candidates
    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) {
      await manageCandidatesBtn.locator.click();
    }

    await page.waitForTimeout(5000);

    // Select a non-CASL compliant talent
    // Open the Talent module
    for (const frame of [page, ...page.frames()]) {
      const talentModule = frame.locator('#talent-module, [data-module="talent"], div.ButtonNormal:has-text("Talent")');
      if (await talentModule.count().catch(() => 0) > 0) {
        await talentModule.first().click();
        break;
      }
    }
    await page.waitForTimeout(3000);

    let clicked = false;
    for (const frame of page.frames()) {
      const orderLink = frame.locator('#talent-module');
      const count = await orderLink.count().catch(() => 0);
      if (count > 0) {
        await orderLink.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) throw new Error('Could not find #talent-module link');
    await page.waitForTimeout(3000);

    // Click New Search
    await clickAsaba(page, 'New Search');
    await page.waitForTimeout(2000);

    // Set search criteria for non-CASL compliant talent
    const homeCountrySelect = await findInFrames(page, '#country_id, select[name="country_id"]');
    if (homeCountrySelect) await homeCountrySelect.locator.selectOption('2');

    const marketSelect = await findInFrames(page, '#market_id, select[name="market_id"]');
    if (marketSelect) await marketSelect.locator.selectOption('47');

    // Click CASL implicit radio button
    await clickInFrames(page, "//input[@value='I']");

    // Execute search
    await clickAsaba(page,'Execute');
    await page.waitForTimeout(5000);
await page.pause();
    // Select first result row and get person ID
    let caslPersonId;
    for (const frame of [page, ...page.frames()]) {
      const firstRow = frame.locator('tr.dataRow, tr.row1, tr.rowClass1').first();
      if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstRow.click();
        const personIdCell = frame.locator('td.personId, td:nth-child(1)').first();
        if (await personIdCell.isVisible({ timeout: 2000 }).catch(() => false)) {
          caslPersonId = (await personIdCell.textContent()).trim();
        }
        break;
      }
    }

    // Click Make Candidate for the talent
    await clickAsaba(page, 'Make Candidate');
    await page.waitForTimeout(2000);

    // Search for the created order and click Make Candidate
    const orderIdInput = await findInFrames(page, '#order-id, input[name="orderId"], input[name="orderID"]');
    if (orderIdInput) {
      await orderIdInput.locator.fill('');
      await orderIdInput.locator.fill(orderId);
    }

    await clickInFrames(page, '#run-search, input[value="Search"], button:has-text("Search")');
    await page.waitForTimeout(3000);

    await clickInFrames(page, '#make-candidate, input[value="Make Candidate"], button:has-text("Make Candidate")');
    await page.waitForTimeout(3000);

    // Handle popup window if one opens
    const pages = page.context().pages();
    const popupPage = pages.length > 1 ? pages[pages.length - 1] : page;

    // Set candidate status in the popup/frame
    await selectCandidateStatusType(popupPage, 'approved_by_recruiter');
    await clickNextButton(popupPage);
    await clickInFrames(popupPage, '#save, input[value="Save"], button:has-text("Save")');
    await popupPage.waitForTimeout(2000);

    // Select the CASL person and click Message
    for (const frame of [popupPage, ...popupPage.frames()]) {
      const row = frame.locator(`tr[data-key="${caslPersonId}"]`);
      if (await row.count().catch(() => 0) > 0) {
        await row.first().click();
        break;
      }
    }

    await clickAsaba(popupPage, 'Message');
    await popupPage.waitForTimeout(5000);

    // Get the message candidate iframe URL
    const messageCandidateFrame = await findInFrames(popupPage, 'iframe[src*="message"], iframe.message-candidate-frame, #message-candidate-frame');
    let url;
    if (messageCandidateFrame) {
      url = await messageCandidateFrame.locator.getAttribute('src');
    }

    // Close popup if it was a separate window
    if (popupPage !== page) {
      await popupPage.close();
    }

    // Navigate to the iframe URL
    await tryTargetIframe(page, url);
    await page.waitForTimeout(2000);

    // Expect the modal with "Return to Manage Candidates" button
    const returnToMcButton = await findInFrames(page, 'button:has-text("Return to Manage Candidates"), a:has-text("Return to Manage Candidates"), .return-to-mc', 10000);
    expect(returnToMcButton).not.toBeNull();

    // Because of the way we target the iframe, we need to work around the double-rendered button
    // before expecting the redirect back to manage candidates
    await returnToMcButton.locator.evaluate((el) => el.click());
    await page.waitForTimeout(3000);

    // Verify we're back on Manage Candidates
    const mcPage = await waitForInFrames(page, 'tr[data-key], div.ButtonNormal:has-text("Manage Candidates")', 15000);
    expect(mcPage).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Test 3: should allow the user to send a custom gather with an un-posted
  //         job (BIZ-21978)
  // ---------------------------------------------------------------------------
  test('should allow the user to send a custom gather with an un-posted job @BIZ-21978', async ({ page }) => {
    // Create a posting for the order
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // View the posting
    await clickAsaba(page, 'View Posting');
    await page.waitForTimeout(2000);

    // Edit the posting
    await clickAsaba(page, 'Edit Posting');
    await page.waitForTimeout(2000);

    // Accept alert and click Save & Unpost
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await clickInFrames(page, '#save-and-unpost, input[value="Save & Unpost"], button:has-text("Save & Unpost")');
    await page.waitForTimeout(5000);

    // Navigate back to Manage Candidates
    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);

    // Wait for candidates table to load
    await page.waitForTimeout(5000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Select all candidates
    await selectAll(page);

    // Click Message to open email compose form
    await clickAsaba(page, 'Message');
    await page.waitForTimeout(5000);

    // Send gather email
    const sentBody = `${data.email_body}b21978d ${testTimestamp}`;
    await sendGatherEmail(page, sentBody, testTimestamp);

    // Verify candidate statuses changed to "gather sent"
    await page.waitForTimeout(3000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    for (const personId of data.gatherable_talent) {
      const statusCell = await waitForInFrames(page, `tr[data-key="${personId}"] td.candidateStatus, tr[data-key="${personId}"] .status`, 10000);
      expect(statusCell).not.toBeNull();
      const statusText = await statusCell.locator.textContent();
      expect(statusText.trim()).toBe(data.candidate_status_gather_sent);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 4: should allow the talent to answer pre interview questions from a
  //         custom gather (BIZ-30379)
  // ---------------------------------------------------------------------------
  test('should allow the talent to answer pre interview questions from a custom gather @BIZ-30379', async ({ page }) => {
    // Create a new posting
    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // View the posting
    await clickAsaba(page, 'View Posting');
    await page.waitForTimeout(2000);

    // Edit the posting
    await clickAsaba(page, 'Edit Posting');
    await page.waitForTimeout(2000);

    // Add pre-interview questions
    // TODO: Implement addPreInterviewQuestions helper or inline the logic
    //       Original Ruby: add_pre_interview_questions [36,37], [1], automated_custom_question
    const automatedCustomQuestion = data.automated_custom_question.replace('%s', testTimestamp);

    // Select standard questions (IDs 36, 37) — these are typically checkboxes
    for (const questionId of [36, 37]) {
      await clickInFrames(page, `input[value="${questionId}"], input#question_${questionId}, input[name="standardQuestion"][value="${questionId}"]`);
    }

    // Select knockout question (ID 1)
    await clickInFrames(page, 'input[value="1"][name="knockoutQuestion"], input#knockout_1');

    // Add the custom question
    const customQuestionInput = await findInFrames(page, '#custom-question, textarea[name="customQuestion"], input[name="customQuestion"]');
    if (customQuestionInput) {
      await customQuestionInput.locator.fill(automatedCustomQuestion);
    }
    await clickInFrames(page, '#add-question, button:has-text("Add"), input[value="Add"]');
    await clickInFrames(page, '#save-questions, input[value="Save"], button:has-text("Save")');
    await page.waitForTimeout(3000);

    // Navigate back to Manage Candidates
    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Select first candidate and send a message
    for (const frame of [page, ...page.frames()]) {
      const firstRow = frame.locator('tr[data-key]').first();
      if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstRow.click();
        break;
      }
    }

    await clickAsaba(page, 'Message');

    // Wait for the message candidate iframe to appear
    await page.waitForTimeout(5000);
    let url;
    for (const frame of [page, ...page.frames()]) {
      const iframe = frame.locator('iframe[src*="message"], iframe.message-candidate-frame, #message-candidate-frame');
      if (await iframe.count().catch(() => 0) > 0) {
        url = await iframe.getAttribute('src');
        break;
      }
    }
    await tryTargetIframe(page, url);

    const sendTime = Math.floor(Date.now() / 1000);

    // Select default gather template and send
    await sendGatherEmail(page, null, testTimestamp); // body is from template

    // Get the interested link from the message sent
    // TODO: Update IMAP config or switch to Mailinator verification when available
    const emailSearchString = createEmailSearchString('New Opportunity Nom Noms Tester', sendTime);
    const emails = await searchForEmails(
      emailSearchString,
      { data: true, wait: 60 },
      testData.credentials
    );

    // Parse the APPLY link from the last email
    const lastEmail = emails[emails.length - 1];
    const applyLinkMatch = lastEmail.body.match(/<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?APPLY[\s\S]*?<\/a>/i);
    const interestedLink = applyLinkMatch ? applyLinkMatch[1] : null;
    expect(interestedLink).not.toBeNull();

    // Visit the link and answer the pre-interview questions
    await page.goto(interestedLink);
    await page.waitForTimeout(5000);

    // Fill out the Gather Availability page
    const salaryInput = await findInFrames(page, '#salary, input[name="salary"], .salary-input', 20000);
    expect(salaryInput).not.toBeNull();

    // Quick fill the availability form
    // TODO: Implement quickFill helper — fills salary, availability date, etc. with defaults
    await clickInFrames(page, '#quick-fill, button:has-text("Quick Fill"), input[value="Quick Fill"]').catch(() => {
      // If no quick fill button, fill fields manually
    });

    // Fill salary if quick fill didn't work
    if (salaryInput) {
      await salaryInput.locator.fill('50000');
    }

    // Click Next to proceed to pre-interview questions
    await clickInFrames(page, 'button:has-text("Next"), input[value="Next"], .next-button');
    await page.waitForTimeout(3000);

    // Answer all pre-interview questions
    const answers = data.pre_interview_question_answers.map(
      (answer) => answer.replace('%s', testTimestamp)
    );

    // TODO: Implement answerAllQuestions helper or adjust selectors to match actual form
    //       Original Ruby: top_page.answer_all_questions(answers)
    const questionInputs = [];
    for (const frame of [page, ...page.frames()]) {
      const inputs = frame.locator('textarea.question-answer, input.question-answer, textarea[name*="answer"], input[name*="answer"]');
      const count = await inputs.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        questionInputs.push(inputs.nth(i));
      }
      if (questionInputs.length > 0) break;
    }

    for (let i = 0; i < Math.min(answers.length, questionInputs.length); i++) {
      await questionInputs[i].fill(answers[i]);
    }

    // Click Next to submit answers
    await clickInFrames(page, 'button:has-text("Next"), input[value="Next"], .next-button');
    await page.waitForTimeout(3000);

    // Go back to manage candidates for the order
    await visitAndLogin(page, config);
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'Manage Candidates');
    await page.waitForTimeout(3000);
    await waitForInFrames(page, 'tr[data-key]', 30000);

    // Verify the talent's response is correctly displayed
    const talentId = data.gatherable_talent[data.gatherable_talent.length - 1];
    const expectedTalentResponseString = (data.expected_talent_response_string || '')
      .replace('%s', automatedCustomQuestion)
      .replace('%s', answers[answers.length - 1]);

    const talentResponseCell = await waitForInFrames(page, `tr[data-key="${talentId}"] td.response, tr[data-key="${talentId}"] .talent-response`, 10000);
    expect(talentResponseCell).not.toBeNull();
    const talentResponseText = await talentResponseCell.locator.textContent();
    expect(talentResponseText).toContain(expectedTalentResponseString);

    // Go to the talent's activity history — double-click candidate row to open TalentDetail
    let talentFound = false;
    for (const frame of page.frames()) {
      const talentRow = frame.locator(`tr[data-key="${talentId}"]`);
      const count = await talentRow.count().catch(() => 0);
      if (count > 0) {
        await talentRow.first().dblclick();
        talentFound = true;
        break;
      }
    }
    if (!talentFound) {
      const talentRow = page.locator(`tr[data-key="${talentId}"]`);
      const count = await talentRow.count().catch(() => 0);
      if (count > 0) {
        await talentRow.first().dblclick();
        talentFound = true;
      }
    }
    if (!talentFound) throw new Error(`Could not find talent row for ${talentId}`);

    await page.waitForTimeout(5000);

    // Switch to Activity History tab
    await switchTab(page, 'activity_history');
    await page.waitForTimeout(3000);

    // Verify the correct activity type is displayed
    const activityText = await waitForInFrames(page, `text=${data.expected_activity_type_string}`, 15000);
    expect(activityText).not.toBeNull();

    // Verify the talent's response is correctly displayed in activity history
    const responseInHistory = await waitForInFrames(page, `text=${expectedTalentResponseString}`, 15000);
    expect(responseInHistory).not.toBeNull();
  });
});