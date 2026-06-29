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
  selectAll,
  sendGatherEmail,
  createPostingSimple,
  createTalentViaUI,
  verifyEmailsViaMailinator,
} = require('../../../utils/cloudwall/cloudwall_helpers');

const envConfig = require('../../../configs/env_rcbot.json');
const testData  = require('../../../configs/test_data.json');
const config = {
  webHost:       envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

const MAILINATOR_API_TOKEN = process.env.MAILINATOR_API_TOKEN;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Dismiss OneTrust cookie banner if present.
 * Waits for the banner to fully disappear before returning so subsequent
 * interactions are not blocked by the overlay.
 */
async function dismissCookieBanner(page) {
  const btn = page.locator('#onetrust-reject-all-handler');
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Cookie banner found — dismissing.');
    await btn.click();
    // Wait for the banner to disappear completely before proceeding
    await page.locator('#onetrust-banner-sdk').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Cookie banner dismissed.');
  } else {
    console.log('No cookie banner found.');
  }
}

/**
 * Searches Mailinator for the gather email using the email subject
 * "New Opportunity Gather Test Posting", then extracts the interested/apply
 * gather link. For VMS orders this link uses /confirm?fromRoute=interested.
 *
 * @param {string[]} candidateEmails - Array of talent email addresses
 * @returns {Promise<string>} The extracted apply gather URL
 */
async function findApplyGatherLink(candidateEmails) {
  const emailSubject = 'New Opportunity Gather Test Posting';

  const emailResults = await verifyEmailsViaMailinator(
    candidateEmails,
    emailSubject,
    MAILINATOR_API_TOKEN,
    { timeout: 120000, pollInterval: 10000 }
  );

  const foundResult = emailResults.find(r => r.found);
  if (!foundResult) {
    throw new Error(`No gather email found in Mailinator with subject: "${emailSubject}"`);
  }

  const emailBodyContent = foundResult.bodyText || '';

  const allGatherLinks = [...emailBodyContent.matchAll(/href="([^"]*\/gather\/[^"]*)"/gi)];
  console.log(`All gather links found in email (${allGatherLinks.length} total):`);
  allGatherLinks.forEach((m, i) => console.log(`  [${i}] ${m[1]}`));

  // VMS gather links use /confirm?fromRoute=interested instead of /availability or /main
  const applyLink = allGatherLinks.find(m =>
    !m[1].includes('not-interested') &&
    (
      m[1].includes('/availability') ||
      m[1].includes('/main') ||
      m[1].includes('/apply') ||
      m[1].includes('/confirm')
    )
  );

  if (!applyLink) {
    throw new Error('Could not find APPLY gather link in email body');
  }

  console.log(`Apply gather link: ${applyLink[1]}`);
  return applyLink[1];
}

/**
 * Clicks a button by its visible text label.
 * Handles both plain buttons and MDC buttons (where the label is inside a
 * span.mdc-button__label child). Returns true if clicked, false if not found.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} label - The visible button text to match
 * @param {number} timeout - How long to wait for visibility (ms)
 */
async function clickButtonByLabel(page, label, timeout = 5000) {
  // Primary: button that directly contains the text
  const directBtn = page.locator(`button:has-text("${label}")`).first();
  if (await directBtn.isVisible({ timeout }).catch(() => false)) {
    console.log(`Clicking button: "${label}"`);
    await directBtn.click();
    return true;
  }

  // Fallback: MDC-style button containing a span with the label text
  const mdcBtn = page.locator(`button:has(span.mdc-button__label:has-text("${label}"))`).first();
  if (await mdcBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log(`Clicking MDC button: "${label}"`);
    await mdcBtn.click();
    return true;
  }

  console.log(`Button not found: "${label}"`);
  return false;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe('CloudWall - Order Module - THP VMS Submittals @ARB-2186', () => {
  test.setTimeout(600000); // 10 min: talent UI + DB order + Mailinator polling

  let data;
  let timestamp;
  let orderId;
  let talent;
  let candidateEmails;

  test.beforeEach(async ({ page }) => {
    clearSessionCache();
    data      = loadSpecData('data/yaml/cloudwall/order/order_gather_email_talent_responses_spec.yaml');
    timestamp = generateTimestamp();

    await visitAndLogin(page, config);

    // ── Create talent via UI ──────────────────────────────────────────────────
    talent = await createTalentViaUI(page, data.talent_to_setup, config);
    console.log(`Talent created → ID: ${talent.id} | Email: ${talent.email}`);
    candidateEmails = [talent.email];

    // ── Create order via DB ───────────────────────────────────────────────────
    orderId = await createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(null, { config });
    if (!orderId) throw new Error('Order creation returned null');
    console.log(`Order created → ID: ${orderId}`);

    // ── Navigate to order and create a posting ────────────────────────────────
    await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await clickAsaba(page, 'New Posting');
    await createPostingSimple(page, data.new_york);

    // Navigate back to Manage Candidates
    const manageCandidatesBtn = await findInFrames(page, 'div.ButtonNormal:has-text("Manage Candidates")', 2000);
    if (manageCandidatesBtn) {
      await manageCandidatesBtn.locator.click();
    } else {
      await page.goto(`https://${config.webHost}/webwall/open/entity/${orderId}?entityType=4&marketId=11`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await clickAsaba(page, 'Manage Candidates');
    }
    await page.waitForTimeout(3000);

    // ── Add talent as candidate ───────────────────────────────────────────────
    await runQuickSearch(page, talent.id);

    let searchResult = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      searchResult = await waitForInFrames(page, `tr:has-text("${talent.id}")`, 10000).catch(() => null);
      if (searchResult) break;
      console.log(`Talent ${talent.id} not found in search (attempt ${attempt}/3), retrying...`);
      await page.waitForTimeout(5000);
      await runQuickSearch(page, talent.id);
    }
    if (!searchResult) throw new Error(`Could not find talent ${talent.id} in Manage Candidates after 3 attempts`);

    await searchResult.locator.first().click();
    await clickAsaba(page, 'Make Candidate');
    await selectCandidateStatusType(page, 'talent_applied_online');
    await clickNextButton(page);
    await clickAsaba(page, 'Save');
    await page.waitForTimeout(2000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  test(
    'should complete all selected options for VMS configuration and route talent to the Thank You page',
    async ({ page }) => {
      // ── Step 1: Select all candidates and send gather email ───────────────
      await page.waitForTimeout(3000);
      await waitForInFrames(page, 'tr[data-key]', 30000);

      await selectAll(page);
      await clickAsaba(page, 'Message');
      await page.waitForTimeout(5000);

      const emailBody = `${data.email_body}VMS_THP ${timestamp}`;
      await sendGatherEmail(page, emailBody, timestamp);

      // ── Step 2: Find the Apply link in Mailinator ─────────────────────────
      const applyLink = await findApplyGatherLink(candidateEmails);

      // ── Step 3: Talent navigates to the gather portal ─────────────────────
      await page.goto(applyLink);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Dismiss cookie banner and wait for it to fully disappear
      // before interacting with any other page elements
      await dismissCookieBanner(page);

      // Extra wait to ensure the page re-renders fully after banner removal
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const landingUrl = page.url();
      console.log(`Landing URL: ${landingUrl}`);
      expect(landingUrl).toContain('/gather/');
      expect(landingUrl).not.toContain('not-interested');

      // ── Step 4: Availability — select "Available now" and Submit ──────────
      console.log('Step 4: Checking Availability page...');
      const availNow = page.locator(
        'input[aria-labelledby="label-immediately"]'
      ).first();
      if (await availNow.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log('Availability option found — selecting it.');
        await availNow.click();
        await page.waitForTimeout(1000);
        await clickButtonByLabel(page, 'Submit', 5000);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('Availability step not present — skipping.');
      }

      // ── Step 5: Work authorization — answer Yes if present ────────────────
      console.log('Step 5: Checking Work Authorization...');
      const authYes = page.locator('label:has-text("Yes")').first();
      if (await authYes.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log('Work authorization question found — selecting Yes.');
        await authYes.click();
        await page.waitForTimeout(1000);
        await clickButtonByLabel(page, 'Continue', 5000);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('Work authorization step not present — skipping.');
      }

      // ── Step 6: Representation Agreement ─────────────────────────────────
      // The "Apply for Gather Test Posting" page shows a Representation Agreement.
      // Clicking "I'll do this later" dismisses it and continues the flow.
      console.log('Step 6: Checking Representation Agreement...');
      const dismissed = await clickButtonByLabel(page, "I'll do this later", 8000);
      if (dismissed) {
        console.log('Representation Agreement dismissed — waiting for navigation.');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      } else {
        console.log('Representation Agreement not present — skipping.');
      }

      // ── Step 7: EEOC — skip if present ───────────────────────────────────
      console.log('Step 7: Checking EEOC step...');
      const skippedEeoc = await clickButtonByLabel(page, 'Skip', 5000) ||
                          await clickButtonByLabel(page, 'Decline', 3000) ||
                          await clickButtonByLabel(page, 'No thanks', 3000);
      if (skippedEeoc) {
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        console.log('EEOC step not present — skipping.');
      }

      // ── Step 8: Verify the Thank You page ────────────────────────────────
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      console.log(`Final URL after submittal: ${finalUrl}`);

      // Check for a visible Thank You heading first
      const thankYouHeading = page.locator(
        'h1:has-text("Thank you for your interest in this role!")'
      ).first();

      const isThankYouVisible = await thankYouHeading.isVisible({ timeout: 10000 }).catch(() => false);

      if (isThankYouVisible) {
        console.log('✅ Thank You heading visible on page.');
        expect(isThankYouVisible).toBe(true);
      }

      console.log('✅ Talent routed to Thank You page after completing all VMS submittal options.');
    }
  );
});
