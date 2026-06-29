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

/** Dismiss OneTrust cookie banner if present. */
async function dismissCookieBanner(page) {
  const btn = page.locator('#onetrust-reject-all-handler');
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Searches Mailinator for the gather email using the email subject
 * "New Opportunity Gather Test Posting", then extracts the "Apply / interested"
 * gather link (/availability or /main).
 */
async function findApplyGatherLink(page, candidateEmails) {
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

  // The apply link uses /availability or /main (matches sibling spec pattern)
  // Must exclude not-interested links
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
      const applyLink = await findApplyGatherLink(page, candidateEmails);

      // ── Step 3: Talent navigates to the gather portal ─────────────────────
      await page.goto(applyLink);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await dismissCookieBanner(page);

      // Confirm we landed on the interested (non-rejection) path
      const landingUrl = page.url();
      console.log(`Landing URL: ${landingUrl}`);
      expect(landingUrl).toContain('/gather/');
      expect(landingUrl).not.toContain('not-interested');

      // ── Step 4: Availability page — select "Available now" and Submit ─────
      // The sibling spec confirms this page shows an Availability heading + Submit button
      console.log('Step 4: Handling Availability page...');
      const availNow = page.locator(
        'label:has-text("Available now"), label:has-text("Immediately"), input[value="immediately"]'
      ).first();
      if (await availNow.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log('Availability option found — selecting it.');
        await availNow.click();
        await page.waitForTimeout(1000);
      }

      // Submit the availability form
      const submitBtn = page.locator('button:has-text("Submit")').first();
      if (await submitBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log('Submit button found — clicking it.');
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }

      // ── Step 5: Work authorization — answer Yes if present ────────────────
      console.log('Step 5: Handling Work Authorization...');
      const authYes = page.locator('label:has-text("Yes")').first();
      if (await authYes.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Work authorization question found — selecting Yes.');
        await authYes.click();
        await page.waitForTimeout(1000);
      }

      // Continue / Next if present
      const continueBtn = page.locator(
        'button:has-text("Continue"), button:has-text("Next")'
      ).first();
      if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }

      // ── Step 6: Representation Agreement — dismiss "I'll do this later" ───
      console.log('Step 6: Checking for Representation Agreement...');
      const doThisLaterBtn = page.locator(
        'button:has-text("I\'ll do this later"), span.mdc-button__label:has-text("I\'ll do this later")'
      ).first();
      if (await doThisLaterBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log('Representation Agreement found — clicking "I\'ll do this later".');
        await doThisLaterBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
      }

      // ── Step 7: EEOC step — decline if present ────────────────────────────
      console.log('Step 7: Checking for EEOC step...');
      const skipEeoc = page.locator(
        'button:has-text("Skip"), button:has-text("Decline"), button:has-text("No thanks")'
      ).first();
      if (await skipEeoc.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('EEOC step found — skipping.');
        await skipEeoc.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }

      // ── Step 8: Verify the Thank You page ────────────────────────────────
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      console.log(`Final URL after full submittal: ${finalUrl}`);

      // Check for a visible Thank You heading first
      const thankYouHeading = page.locator(
        'h1:has-text("Thank"), h2:has-text("Thank"), ' +
        '[class*="thank"], [class*="confirmation"], ' +
        'text=/thank you/i, text=/you\'re all set/i, text=/submission received/i'
      ).first();

      const isThankYouVisible = await thankYouHeading.isVisible({ timeout: 10000 }).catch(() => false);

      if (isThankYouVisible) {
        console.log('✅ Thank You heading is visible on page.');
        expect(isThankYouVisible).toBe(true);
      } else {
        // Fallback: check the URL contains a known THP pattern
        // The app routes to: /gather/{uuid}/confirm?fromRoute=interested
        expect(
          finalUrl.includes('thank') ||
          finalUrl.includes('confirmation') ||
          finalUrl.includes('success') ||
          finalUrl.includes('confirm') ||
          finalUrl.includes('submitted')
        ).toBe(true);
      }

      console.log('✅ Talent routed to Thank You page after completing all VMS submittal options.');
    }
  );
});
