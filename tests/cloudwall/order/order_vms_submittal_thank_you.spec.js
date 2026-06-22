// Covers: ARB-2186
// "THP VMS Submittals should complete all selected options for selected VMS
//  configuration and route to thank you page"

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
  selectCandidateStatusType,
  clickNextButton,
  sendGatherEmail,
  createPostingSimple,
  createTalentViaUI,
  verifyEmailsViaMailinator,
} = require('../../../utils/cloudwall/cloudwall_helpers');

const envConfig  = require('../../../configs/env_rcbot.json');
const testData   = require('../../../configs/test_data.json');
const config = {
  webHost:       envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

const MAILINATOR_API_TOKEN = process.env.MAILINATOR_API_TOKEN;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Dismiss OneTrust cookie banner if present. */
async function dismissCookieBanner(page) {
  const btn = page.locator('#onetrust-reject-all-handler');
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1000);
  }
}

/** Create a talent via UI and return { id, email, firstName, lastName }. */
async function createAndViewTalent(page, talentSetup) {
  const talent = await createTalentViaUI(page, talentSetup, config);
  console.log(`Talent created → ID: ${talent.id} | Email: ${talent.email}`);
  return talent;
}

/** Create a DB order, add a posting, and return the orderId. */
async function createOrderWithPosting(page, postingData, timestamp) {
  const orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, { config });
  if (!orderId) throw new Error('Order creation returned null');

  await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  await clickAsaba(page, 'New Posting');
  await createPostingSimple(page, postingData);

  // Edit posting title to include timestamp for later email search
  const viewBtn = await findInFrames(page, 'div.ButtonNormal:has-text("View Posting Detail")', 3000);
  if (viewBtn) { await viewBtn.locator.first().click(); await page.waitForTimeout(2000); }

  const editBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Edit Posting")', 3000);
  if (editBtn) {
    await editBtn.locator.first().click();
    await page.waitForTimeout(2000);
    const titleInput = await findInFrames(page, 'input[name="localizedDescription[0].jobTitle"]');
    if (titleInput) {
      await titleInput.locator.clear();
      await titleInput.locator.fill(postingData.job_title + ' ' + timestamp);
    }
    await clickAsaba(page, 'Save');
    await page.waitForTimeout(2000);
  }

  console.log(`Order created → ID: ${orderId}`);
  return orderId;
}

/** Add talent to the order as a candidate. */
async function addTalentAsCandidate(page, orderId, talentId) {
  await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  await clickAsaba(page, 'Manage Candidates');
  await page.waitForTimeout(3000);

  // Retry search up to 3 times (search index may lag)
  for (let attempt = 1; attempt <= 3; attempt++) {
    await runQuickSearch(page, talentId);
    const row = await waitForInFrames(page, `tr:has-text("${talentId}")`, 15000).catch(() => null);
    if (row) { await row.locator.first().click(); break; }
    if (attempt === 3) throw new Error(`Talent ${talentId} not found in Manage Candidates after 3 attempts`);
    await page.waitForTimeout(5000);
  }

  await clickAsaba(page, 'Make Candidate');
  await selectCandidateStatusType(page, 'talent_applied_online');
  await clickNextButton(page);
  await clickAsaba(page, 'Save');
  await page.waitForTimeout(2000);
}

/** Select the candidate and send a gather email. */
async function gatherTalent(page, talentId, emailSubject, timestamp) {
  await page.waitForTimeout(3000);
  await waitForInFrames(page, 'tr[data-key]', 30000);

  let found = false;
  for (const frame of page.frames()) {
    const row = frame.locator(`tr[data-key="${talentId}"]`);
    if (await row.count().catch(() => 0) > 0) {
      await row.first().click();
      found = true;
      break;
    }
  }
  if (!found) throw new Error(`Candidate row not found for talent ${talentId}`);

  await clickAsaba(page, 'Message');
  await page.waitForTimeout(5000);
  await sendGatherEmail(page, emailSubject, timestamp);
}

/**
 * Poll Mailinator for the gather email and extract the APPLY link.
 * Reuses the verifyEmailsViaMailinator helper (same pattern as sibling spec files).
 */
async function getApplyGatherLink(candidateEmails, searchText) {
  const emailResults = await verifyEmailsViaMailinator(
    candidateEmails,
    searchText,
    MAILINATOR_API_TOKEN,
    { timeout: 120000, pollInterval: 10000 }
  );

  const foundResult = emailResults.find(r => r.found);
  if (!foundResult) {
    throw new Error(`No gather email found in Mailinator for: "${searchText}"`);
  }

  const emailBodyContent = foundResult.bodyText || '';
  const allGatherLinks = [...emailBodyContent.matchAll(/href="([^"]*\/gather\/[^"]*)"/gi)];
  const applyLink = allGatherLinks.find(m =>
    !m[1].includes('not-interested') &&
    (m[1].includes('/availability') || m[1].includes('/main') || m[1].includes('/apply'))
  );

  if (!applyLink) {
    throw new Error('Could not find APPLY link in gather email body');
  }

  console.log(`Apply gather link found: ${applyLink[1]}`);
  return applyLink[1];
}

// ─── Test suite ──────────────────────────────────────────────────────────────

test.describe('CloudWall - Order Module - THP VMS Submittals @ARB-2186', () => {
  test.setTimeout(600000); // 10 min: talent UI creation + order DB + email polling

  let data;
  let timestamp;

  test.beforeEach(async () => {
    clearSessionCache();
    data = loadSpecData('data/yaml/cloudwall/order/order_gather_email_talent_responses_spec.yaml');
    timestamp = generateTimestamp();
  });

  test(
    'should complete all selected options for VMS configuration and route talent to the Thank You page',
    async ({ page }) => {
      await visitAndLogin(page, config);

      // ── Step 1: Create talent via UI ──────────────────────────────────────
      const talent = await createAndViewTalent(page, data.talent_to_setup);

      // ── Step 2: Create order (financial.vms_name = Fieldglass) + posting ──
      const postingData = data.new_york;
      const orderId     = await createOrderWithPosting(page, postingData, timestamp);

      // ── Step 3: Add talent as candidate ───────────────────────────────────
      await addTalentAsCandidate(page, orderId, talent.id);

      // ── Step 4: Send gather email from Manage Candidates ──────────────────
      const emailSubject = `${postingData.job_title} ${timestamp}`;
      await gatherTalent(page, talent.id, emailSubject, timestamp);

      // ── Step 5: Retrieve APPLY link from Mailinator ───────────────────────
      const candidateEmails = [talent.email];
      const applyLink = await getApplyGatherLink(candidateEmails, emailSubject);

      // ── Step 6: Talent navigates to gather portal ─────────────────────────
      await page.goto(applyLink);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await dismissCookieBanner(page);

      // Confirm we landed on the interested (non-rejection) path
      expect(page.url()).toContain('/gather/');
      expect(page.url()).not.toContain('not-interested');

      // ── Step 7: Complete all VMS submittal options ────────────────────────

      // 7a. Availability — select "Available now" if present
      const availNow = page.locator(
        'label:has-text("Available now"), label:has-text("Immediately"), input[value="immediately"]'
      ).first();
      if (await availNow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await availNow.click();
      }

      // 7b. Work authorization questions (VMS-required) — answer Yes
      const authQuestion = page.locator('label:has-text("Yes")').first();
      if (await authQuestion.isVisible({ timeout: 5000 }).catch(() => false)) {
        await authQuestion.click();
      }

      // 7c. Continue / Next through remaining steps
      const continueBtn = page.locator(
        'button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit")'
      ).first();
      if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(3000);
      }

      // 7d. EEOC step — skip/decline if present
      const skipEeoc = page.locator(
        'button:has-text("Skip"), button:has-text("Decline"), button:has-text("No thanks")'
      ).first();
      if (await skipEeoc.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipEeoc.click();
        await page.waitForTimeout(2000);
      }

      // ── Step 8: Verify the Thank You page is displayed ────────────────────
      await page.waitForTimeout(3000);

      const thankYouHeading = page.locator(
        'h1:has-text("Thank"), h2:has-text("Thank"), h1:has-text("thank"), ' +
        '[class*="thank"], [class*="confirmation"], ' +
        'text=/thank you/i, text=/you.re all set/i, text=/submission received/i'
      ).first();

      const isThankYouVisible = await thankYouHeading.isVisible({ timeout: 10000 }).catch(() => false);

      if (!isThankYouVisible) {
        // Fallback: check URL for a confirmation segment
        const currentUrl = page.url();
        console.log(`Current URL after submittal: ${currentUrl}`);
        expect(
          currentUrl.includes('thank') ||
          currentUrl.includes('confirmation') ||
          currentUrl.includes('success')
        ).toBe(true);
      } else {
        expect(isThankYouVisible).toBe(true);
      }

      console.log('✅ Talent routed to Thank You page after completing VMS submittal options.');
    }
  );
});
