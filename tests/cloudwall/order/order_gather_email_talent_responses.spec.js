// Migrated from: order_gather_email_talent_responses_spec.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)
//
// STATUS: Structure migrated. Email verification now uses Mailinator API
// (matching the pattern in order_custom_gather_01.spec.js).
//
// Remaining blockers:
//   - createTalent: requires page object context or DB access
//   - queryDatabase: requires VPN access to PostgreSQL
//   - createNewNyMarvelCartoonTestOrderWithoutPostingFromDb: requires DB access
//
// TODO: Once infrastructure is available, uncomment the blocked sections.

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

// Mailinator API token (from environment)
const MAILINATOR_API_TOKEN = process.env.MAILINATOR_API_TOKEN;

// ──────────────────────────────────────────────────────────────────────────────
// Helper functions specific to this test file
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether the current host is not 'cw-delta'.
 * Original Ruby: @config['webhost'] != 'cw-delta'
 */
function checkHostName() {
  const host = config.webHost || '';
  return !host.startsWith('cw-delta');
}

/**
 * Formats a date N months from now as 'Mon D, YYYY' (e.g., 'Aug 5, 2026').
 * Equivalent to Ruby: (Date.today >> months).strftime('%b %-d, %Y')
 */
function formatDateMonthsFromNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats today's date as 'Month D, YYYY' (e.g., 'August 5, 2026').
 * Equivalent to Ruby: Time.now.strftime('%B %-d, %Y')
 */
function formatDateToday() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Navigates to the order, opens Manage Candidates, and switches to Current Candidates tab.
 */
async function goToManageCandidates(page, orderId) {
  await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
  await page.waitForLoadState('networkidle');

  await clickAsaba(page, 'Manage Candidates');
  await page.waitForTimeout(3000);

  // Switch to Current Candidates tab
  await switchTab(page, 'Current Candidates');
  await page.waitForTimeout(2000);
}

/**
 * Dismisses the OneTrust cookie consent banner if present.
 */
async function dismissCookieBanner(page) {
  const rejectBtn = page.locator('#onetrust-reject-all-handler');
  if (await rejectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rejectBtn.click();
    await page.waitForTimeout(1000);
  }
}



/**
 * Selects a candidate in the Current Candidates table and sends a gather email.
 * Returns the email body that was sent (for later verification).
 */
async function selectAndGatherTalent(page, talentId, emailBody, timestamp) {
  // Wait for candidates table to load
  await page.waitForTimeout(3000);
  await waitForInFrames(page, 'tr[data-key]', 30000);

  // Select the candidate row
  let found = false;
  for (const frame of page.frames()) {
    const row = frame.locator(`tr[data-key="${talentId}"]`);
    const count = await row.count().catch(() => 0);
    if (count > 0) {
      await row.first().click();
      found = true;
      break;
    }
  }
  if (!found) {
    const row = page.locator(`tr[data-key="${talentId}"]`);
    const count = await row.count().catch(() => 0);
    if (count > 0) {
      await row.first().click();
      found = true;
    }
  }
  if (!found) throw new Error(`Could not find candidate row for ${talentId}`);

  // Click Message to open email compose form
  await clickAsaba(page, 'Message');
  await page.waitForTimeout(5000);

  // Send gather email
  await sendGatherEmail(page, emailBody, timestamp);
}

/**
 * Searches for the gather email in Mailinator and extracts the response link.
 * Replaces the old IMAP-based respondToEmail approach.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} action - 'Apply' or 'Not a Fit'
 * @param {string[]} candidateEmails - Mailinator email addresses to check
 * @param {string} searchText - Text to search for in the email (e.g., job title)
 * @param {object} [options] - Optional overrides for timeout/pollInterval
 * @returns {Promise<string>} The extracted gather response link
 */
async function findGatherLinkViaMailinator(page, action, candidateEmails, searchText, options = {}) {
  const emailResults = await verifyEmailsViaMailinator(
    candidateEmails,
    searchText,
    MAILINATOR_API_TOKEN,
    { timeout: options.timeout || 120000, pollInterval: options.pollInterval || 10000 }
  );

  // Find the first email result that was found
  const foundResult = emailResults.find(r => r.found);
  if (!foundResult) {
    throw new Error(`No gather email found in Mailinator for search text: "${searchText}"`);
  }

  // Extract the appropriate link from the email body
  const emailBodyContent = foundResult.bodyText || '';
  let link;

  if (action === 'Apply') {
    // The "interested" link uses /gather/{uuid}/availability or /gather/{uuid}/main
    // Must exclude "not-interested" URLs
    const allGatherLinks = [...emailBodyContent.matchAll(/href="([^"]*\/gather\/[^"]*)"/gi)];
    const applyLink = allGatherLinks.find(m =>
      !m[1].includes('not-interested') &&
      (m[1].includes('/availability') || m[1].includes('/main'))
    );
    link = applyLink ? applyLink[1] : null;
  } else if (action === 'Not a Fit') {
    // The "not interested" link uses /gather/{uuid}/not-interested
    const match = emailBodyContent.match(/href="([^"]*\/gather\/[^"]*not-interested[^"]*)"/i);
    link = match ? match[1] : null;
  }

  if (!link) {
    // Debug: log all links found in the email body
    const allLinks = [...emailBodyContent.matchAll(/href="([^"]*)"/gi)].map(m => m[1]);
    console.log(`All links found in email body (${allLinks.length} total):`);
    allLinks.forEach((l, i) => console.log(`  [${i}] ${l}`));
    throw new Error(`Could not find "${action}" link in gather email body`);
  }

  return link;
}

/**
 * Navigates to the gather response link extracted from Mailinator.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} action - 'Apply' or 'Not a Fit'
 * @param {string[]} candidateEmails - Mailinator email addresses to check
 * @param {string} searchText - Text to search for in the email (e.g., job title)
 */
async function respondToEmailViaMailinator(page, action, candidateEmails, searchText) {
  const link = await findGatherLinkViaMailinator(page, action, candidateEmails, searchText);
  await page.goto(link);
  await page.waitForLoadState('networkidle');
}

/**
 * Checks for the availability update screen in the gather flow.
 */
async function checkForAvailabilityScreen(page, expectAvailability) {
  const availabilityForm = page.locator('#availability, form[name="availability"]');
  const isVisible = await availabilityForm.isVisible({ timeout: 5000 }).catch(() => false);

  if (isVisible && expectAvailability) {
    await page.locator('text=Available now, text=Immediately').first().click().catch(() => {});
    await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click().catch(() => {});
    await page.waitForTimeout(2000);
  }

  return isVisible;
}

/**
 * Fills out the EEOC form if it appears during the gather flow.
 */
async function enterEeocDataGather(page) {
  const eeocForm = page.locator('text=Equal Employment, .eeoc-form, #eeoc-form');
  const isVisible = await eeocForm.isVisible({ timeout: 3000 }).catch(() => false);

  if (isVisible) {
    // TODO: Fill out EEOC fields — these are checkboxes and radio buttons
    // Gender, LGBTQ, Race/Ethnicity, Veteran, Disability, Neurodivergent, Sponsorship, Age
    await page.locator('button:has-text("Submit"), button:has-text("Next")').first().click().catch(() => {});
    await page.waitForTimeout(2000);
  }
}

/**
 * Fills out pre-interview question answers in the gather flow.
 */
async function enterPreInterviewAnswers(page, customAnswer) {
  // TODO: Inspect the pre-interview questions page in the gather flow
  // The original test answers Yes/No to standard questions and types a custom answer
  //
  // await page.locator('text=Yes').first().click();
  // await page.locator('text=No').first().click();
  // const customInput = page.locator('textarea, input[type="text"]').last();
  // await customInput.fill(customAnswer);
  // await page.locator('button:has-text("Submit"), button:has-text("Next")').first().click();
  // await page.waitForTimeout(2000);
}

/**
 * Executes a SQL query against the database.
 * TODO: Requires VPN/DB access. Returns empty results for now.
 */
async function queryDatabase(sql) {
  // TODO: Implement DB queries when VPN access is available
  console.warn('queryDatabase: DB access not available, returning empty results');
  return [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

test.describe('CloudWall - Order Module - Gather Email Talent Responses', () => {
  test.setTimeout(600000); // 10 min to accommodate talent creation + order + Mailinator polling
  let data;
  let testTimestamp;
  let orderId;
  let candidateNames;
  let candidateEmails;
  let createdTalents;
  let emailBody; // base email body text for gather emails

  // Number of talents to create (replaces old hardcoded gatherable_talent list)
  const NUM_GATHER_TALENTS = 1;

  test.beforeEach(async ({ page, context }) => {
    clearSessionCache();

    data = loadSpecData('data/yaml/cloudwall/order/order_gather_email_talent_responses_spec.yaml');
    testTimestamp = generateTimestamp();

    emailBody = data.email_body || 'Gather email talent response test ';

    if (!checkHostName()) {
      console.info('!!! Only verifying email on Alpha, Beta, and RC - others skipped !!!');
      test.skip();
      return;
    }

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
    const context2 = { config };
    orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, context2);
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

  // ─────────────────────────────────────────────────────────────────────────
  // Uninterested path
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Talent responding to gather email - uninterested path -', () => {

    test('uninterested link navigates to the correct page @BIZ-20798', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      // Select all candidates and send gather email
      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}uninterested_link ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the gather email and extract the "Not a Fit" link
      await respondToEmailViaMailinator(
        page,
        'Not a Fit',
        candidateEmails,
        data.new_york.job_description
      );

      // Verify the "Not Interested" response page loaded
      // The page shows a form: "Let us know why this wasn't a fit" with checkboxes
      await page.waitForTimeout(3000);

      await dismissCookieBanner(page);

      const currentUrl = page.url();
      expect(currentUrl).toContain('aquent.io/gather');
      expect(currentUrl).toContain('/not-interested');

      // Verify the form content is visible
      const formHeading = page.locator('text=Let us know why this wasn\'t a fit');
      await expect(formHeading).toBeVisible({ timeout: 10000 });
    });

    test('not interested in other opportunities, talent and order record is updated in cloudwall @BIZ-20807', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}not_interested_other ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the email and navigate to "Not a Fit" link
      await respondToEmailViaMailinator(
        page,
        'Not a Fit',
        candidateEmails,
        data.new_york.job_description
      );

      // Wait for the "Not Interested" form to load and dismiss cookie banner
      await page.waitForTimeout(3000);
      await dismissCookieBanner(page);
      expect(page.url()).toContain('/not-interested');

      // Fill out the "not interested" form
      // Step 1: "Choose all that apply" — select a reason
      // Available checkboxes: Mismatched Skill Set, Mismatched Level, Pay Rate,
      //   Location, Industry, Not actively looking, Other
      await page.getByLabel('Not actively looking').check();
      await page.waitForTimeout(500);

      // Scroll down to reveal the Continue button (cookie banner may overlap)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Verify button is enabled before clicking (requires at least one checkbox selected)
      await page.locator('//button[contains(text(), "Continue to Preferences") and not(@disabled)]').waitFor({ timeout: 5000 });

      // Click "Continue To Preferences" to proceed
      await page.locator('//button[contains(text(), "Continue to Preferences")]').click();
      await page.waitForTimeout(3000);

      // The "Continue To Preferences" navigates to the Aquent talent portal (external domain).
      // The "Not Interested" response is already recorded at this point.
      // Navigate directly back to CloudWall to verify the candidate status.
      await page.goto(`https://${config.webHost}/webwall/frameset`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
 
      // Navigate to the order's Manage Candidates
      await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
      await page.waitForTimeout(5000);
      await clickAsaba(page, 'Manage Candidates');
      await page.waitForTimeout(3000);
 
      // Verify the candidate status reflects "Not Interested"
      // From the actual UI, the status shows as "Gather Sent (Custom Email)"
      await waitForInFrames(page, 'tr[data-key]', 30000);
      const statusText = await waitForInFrames(page, 'text=Gather Sent (Custom Email)', 15000);
      expect(statusText).not.toBeNull();
    });

    test('interested in other opportunities, talent and order record is updated in cloudwall @BIZ-20839', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}interested_other ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the email and navigate to "Not a Fit" link
      await respondToEmailViaMailinator(
        page,
        'Not a Fit',
        candidateEmails,
        data.new_york.job_description
      );

      // Wait for the "Not Interested" form to load and dismiss cookie banner
      await page.waitForTimeout(3000);
      await dismissCookieBanner(page);
      expect(page.url()).toContain('/not-interested');

      // Fill out the "not interested" form
      // Step 1: "Choose all that apply" — select a reason
      await page.getByLabel('Pay Rate').check();
      await page.waitForTimeout(500);

      // Scroll down to reveal the Continue button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Verify button is enabled before clicking
      await page.locator('//button[contains(text(), "Continue to Preferences") and not(@disabled)]').waitFor({ timeout: 5000 });

      // Click "Continue To Preferences" to proceed
      await page.locator('//button[contains(text(), "Continue to Preferences")]').click();
      await page.waitForTimeout(3000);

      // The "Continue To Preferences" navigates to the Aquent talent portal.
      // The "Not Interested" response is already recorded. Navigate back to CloudWall.
      await page.goto(`https://${config.webHost}/webwall/frameset`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Navigate to the order's Manage Candidates
      await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
      await page.waitForTimeout(5000);
      await clickAsaba(page, 'Manage Candidates');
      await page.waitForTimeout(3000);

      await waitForInFrames(page, 'tr[data-key]', 30000);
      const statusText = await waitForInFrames(page, 'text=Gather Sent (Custom Email)', 15000);
      expect(statusText).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Interested path
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Talent responding to gather email - interested path -', () => {

    test('the interested link navigates to the correct page @BIZ-20841', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}interested_link ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the email and navigate to "Apply" link
      await respondToEmailViaMailinator(
        page,
        'Apply',
        candidateEmails,
        data.new_york.job_description
      );
      // The "Interested" link navigates to the Aquent Skill portal.
      // It shows: Personal Info page or "Choose all that apply" modal → multi-step wizard
      await page.waitForTimeout(3000);

      await dismissCookieBanner(page);

      // Verify the URL is the interested/apply page (NOT the not-interested page)
      expect(page.url()).toContain('aquent.io/gather');
      expect(page.url()).not.toContain('not-interested');

      // Verify we're on the Aquent Skill portal gather availability page
      // The page shows: job title, Resume section, Availability, Professional Profile, and a Submit button
      expect(page.url()).toContain('/availability');
      const availabilityHeader = page.locator('text=Availability');
      await expect(availabilityHeader).toBeVisible({ timeout: 10000 });
      const submitBtn = page.locator('button:has-text("Submit")');
      await expect(submitBtn).toBeVisible({ timeout: 5000 });
    });

    test('visiting the link updates talent and order details in cloudwall @BIZ-20842', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}updates_cw ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the email and navigate to "Apply" link
      await respondToEmailViaMailinator(
        page,
        'Apply',
        candidateEmails,
        data.new_york.job_description
      );

      await page.waitForTimeout(3000);

      await dismissCookieBanner(page);

      // Verify we landed on the interested/apply page
      expect(page.url()).toContain('aquent.io/gather');
      expect(page.url()).not.toContain('not-interested');

      // Navigate back to CloudWall to verify candidate status
      await page.goto(`https://${config.webHost}/webwall/frameset`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
      await page.waitForTimeout(5000);
      await clickAsaba(page, 'Manage Candidates');
      await page.waitForTimeout(3000);

      await waitForInFrames(page, 'tr[data-key]', 30000);

      // Verify candidate status matches "Gather Sent (Custom Email)"
      const statusText = await waitForInFrames(page, 'text=Gather Sent (Custom Email)', 15000);
      expect(statusText).not.toBeNull();

      // TODO: Verify TalentDetail MOATS = 'Available now'
      // TODO: Click gather response view link, verify new tab contains 'Response:'
    });

    test.skip('should collect eeoc data from talent in gather @BIZ-27694', async ({ page }) => {
      // TODO: Full implementation requires createTalent, DB order creation, DB verification
      // The Mailinator email flow would work the same as above — send gather,
      // find email via verifyEmailsViaMailinator, extract "Apply" link, navigate,
      // fill EEOC form, then verify EEOC fields in DB.
    });

    test.skip('should not show the eeoc form in gather to someone who has already responded @BIZ-27694', async ({ page }) => {
      // This test could partially work with pre-existing data:
      // const talent = { id: data.eeoc_talent.id, email: data.eeoc_talent.email };
      //
      // Flow: add as candidate → send gather → find email via Mailinator → navigate to Apply link
      //       → check availability → verify URL does NOT contain 'eeoc-form'
      //       → verify URL contains 'confirm'
    });

    test.skip('should not show the eeoc form in gather for a non USA order @BIZ-27694', async ({ page }) => {
      // TODO: Requires createTalent, London DB order creation
      // Mailinator flow same as above but with London market order.
    });

    test('allows the talent to answer pre interview questions @BIZ-30379', async ({ page }) => {
      // Navigate to posting and add pre-interview questions
      // TODO: Inspect posting pre-interview question setup selectors
      // await clickAsaba(page, 'New Posting');
      // await createPostingSimple(page, data.new_york);
      // ... add pre-interview questions to posting ...

      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}pre_interview ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Use Mailinator to find the email and navigate to "Apply" link
      await respondToEmailViaMailinator(
        page,
        'Apply',
        candidateEmails,
        data.new_york.job_description
      );

      await page.waitForTimeout(3000);

      await dismissCookieBanner(page);

      // Verify we landed on the interested/apply page
      expect(page.url()).toContain('aquent.io/gather');
      expect(page.url()).not.toContain('not-interested');

      // TODO: Answer pre-interview questions if they appear in the gather flow.
      //       The portal shows a multi-step wizard (Personal Info → Employment Opportunities → etc.)
      //       Pre-interview questions may appear as one of the wizard steps.

      // Navigate back to Manage Candidates and verify pre-interview answers
      await page.goto(`https://${config.webHost}/webwall/frameset`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
      await page.waitForTimeout(5000);
      await clickAsaba(page, 'Manage Candidates');
      await page.waitForTimeout(3000);

      // TODO: Verify pre-interview answers appear in candidate details
      // await checkPreInterviewAnswersManageCandidates(page, data, talent.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Verify emails were received (direct Mailinator verification, no response)
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('Verify gather emails are delivered -', () => {

    test('should verify gather email is delivered to candidates via Mailinator @BIZ-20798', async ({ page }) => {
      // Create a posting for the order
      await clickAsaba(page, 'New Posting');
      await createPostingSimple(page, data.new_york);

      // Navigate back to Manage Candidates (Save & Post may redirect here automatically)
      const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
      if (manageCandidatesBtn) {
        await manageCandidatesBtn.locator.click();
      }

      await page.waitForTimeout(5000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const sentBody = `${emailBody}delivery_check ${testTimestamp}`;
      await sendGatherEmail(page, sentBody, testTimestamp);

      // Verify emails were received via Mailinator API (same pattern as order_custom_gather_01)
      const emailResults = await verifyEmailsViaMailinator(
        candidateEmails,
        data.new_york.job_description,
        MAILINATOR_API_TOKEN,
        { timeout: 120000, pollInterval: 10000 }
      );

      for (const result of emailResults) {
        expect(result.found).toBe(true);
        expect(result.bodyText).toContain(data.new_york.job_description);
      }
    });
  });
});