// utils/cloudwall/cloudwall_helpers.js
//
// Reusable helper functions for CloudWall Playwright tests.
// CloudWall uses a complex nested iframe architecture where content may be
// rendered directly on the page OR inside one or more nested iframes.
// These helpers handle both cases transparently.

const { expect } = require('@playwright/test');

// ──────────────────────────────────────────────────────────────────────────────
// Name generation helpers
// ──────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake',
  'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Kendall', 'Logan',
  'Parker', 'Reese', 'Sage', 'Taylor', 'Wren',
];

const LAST_NAMES = [
  'Ashford', 'Beckett', 'Calloway', 'Delaney', 'Everett', 'Fairbanks',
  'Gallagher', 'Hartwell', 'Inglewood', 'Jennings', 'Kensington', 'Langford',
  'Mercer', 'Northwood', 'Pemberton', 'Quinlan', 'Radcliffe', 'Stafford',
  'Thornton', 'Whitfield',
];

/**
 * Generates a random first/last name pair and a unique Mailinator email.
 * The email format is: aquent+{lastname}{timestamp}@muukteam.testinator.com
 *
 * @returns {{ firstName: string, lastName: string, email: string }}
 */
function generateRandomTalent() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const timestamp = Date.now().toString().slice(-6);
  const email = `aquent+${lastName.toLowerCase()}${timestamp}@muukteam.testinator.com`;
  return { firstName, lastName, email };
}

// ──────────────────────────────────────────────────────────────────────────────
// Frame-aware core helpers
// ──────────────────────────────────────────────────────────────────────────────

async function findInFrames(page, selector, timeout = 3000) {
  const mainLoc = page.locator(selector);
  if (await mainLoc.isVisible({ timeout }).catch(() => false)) {
    return { frame: page, locator: mainLoc };
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const loc = frame.locator(selector);
    if (await loc.isVisible({ timeout }).catch(() => false)) {
      return { frame, locator: loc };
    }
  }
  return null;
}

async function clickAsaba(page, action) {
  const mainLink = page.locator(`a[name="${action}"]`);
  if (await mainLink.isVisible({ timeout: 1500 }).catch(() => false)) {
    await mainLink.click();
    await page.waitForTimeout(1000);
    return;
  }
  const mainButton = page.locator(`div.ButtonNormal:has-text("${action}")`);
  if (await mainButton.isVisible({ timeout: 1500 }).catch(() => false)) {
    await mainButton.click();
    await page.waitForTimeout(1000);
    return;
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const aLink = frame.locator(`a[name="${action}"]`);
    if (await aLink.isVisible({ timeout: 1500 }).catch(() => false)) {
      await aLink.click();
      await page.waitForTimeout(1000);
      return;
    }
    const buttonDiv = frame.locator(`div.ButtonNormal:has-text("${action}")`);
    if (await buttonDiv.isVisible({ timeout: 1500 }).catch(() => false)) {
      await buttonDiv.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
  throw new Error(`Could not find ASABA action link or button: ${action}`);
}

async function clickInFrames(page, selector, timeout = 5000) {
  const result = await findInFrames(page, selector, timeout);
  if (!result) throw new Error(`Could not find element in any frame: ${selector}`);
  await result.locator.click();
}

async function waitForInFrames(page, selector, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    let count = await page.locator(selector).count().catch(() => 0);
    if (count > 0) return { frame: page, locator: page.locator(selector) };
    for (const frame of page.frames()) {
      count = await frame.locator(selector).count().catch(() => 0);
      if (count > 0) return { frame, locator: frame.locator(selector) };
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`Timed out waiting for: ${selector}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Timestamp helper
// ──────────────────────────────────────────────────────────────────────────────

function generateTimestamp() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).charAt(0);
  return `${dd}_${HH}.${MM}.${SS}.${ms}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Search & candidate helpers
// ──────────────────────────────────────────────────────────────────────────────

async function runQuickSearch(page, searchTerm) {
  await clickInFrames(page, 'span:has-text("Search Criteria")', 10000);
  await page.waitForTimeout(1000);
  await clickInFrames(page, 'input#quickSearch');
  await page.waitForTimeout(500);
  const personIdInput = await findInFrames(page, 'input[name="person_id"]');
  if (!personIdInput) throw new Error('Could not find Person ID input');
  await personIdInput.locator.fill(String(searchTerm));
  await clickAsaba(page, 'Run Search');
  await page.waitForTimeout(3000);
}

async function selectRow(page, identifier) {
  const result = await waitForInFrames(page, `tr:has-text("${identifier}")`, 15000);
  await result.locator.first().click();
}

async function getContentForRow(page, identifier) {
  const result = await findInFrames(page, `tr:has-text("${identifier}")`, 15000);
  if (!result) throw new Error(`Could not find row for: ${identifier}`);
  const row = result.locator.first();
  const cells = row.locator('td');
  const cellCount = await cells.count();
  return {
    firstName: cellCount > 1 ? (await cells.nth(1).textContent()).trim() : '',
    lastName: cellCount > 2 ? (await cells.nth(2).textContent()).trim() : '',
    email: cellCount > 3 ? (await cells.nth(3).textContent()).trim() : '',
  };
}

async function selectCandidateStatusType(page, statusType) {
  const statusMap = {
    talent_applied_online: 'Talent Applied Online',
    approved_by_recruiter: 'Approved by Recruiter',
  };
  const result = await findInFrames(page, 'select#status');
  if (!result) throw new Error('Could not find candidate status type selector');
  await result.locator.selectOption({ label: statusMap[statusType] });
}

async function clickNextButton(page) {
  const mainBtn = page.locator('button:has-text("Next"), input[value="Next"], div.ButtonNormal:has-text("Next")');
  if (await mainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mainBtn.click();
    await page.waitForTimeout(1000);
    return;
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;
    const btn = frame.locator('button:has-text("Next"), input[value="Next"], div.ButtonNormal:has-text("Next")');
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
  throw new Error('Could not find Next button');
}

async function selectAll(page) {
  let rows = null;
  let count = 0;
  count = await page.locator('tr[data-key]').count().catch(() => 0);
  if (count > 0) {
    rows = page.locator('tr[data-key]');
  } else {
    for (const frame of page.frames()) {
      count = await frame.locator('tr[data-key]').count().catch(() => 0);
      if (count > 0) {
        rows = frame.locator('tr[data-key]');
        break;
      }
    }
  }
  if (!rows || count === 0) throw new Error('Could not find any candidate rows');
  await rows.nth(0).click();
  if (count > 1) {
    await rows.nth(count - 1).click({ modifiers: ['Shift'] });
  }
  await page.waitForTimeout(500);
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab & editor helpers
// ──────────────────────────────────────────────────────────────────────────────

async function switchTab(page, tabName) {
  const tabTextMap = {
    activity_history: 'Activity History',
    profile: 'Profile',
    summary: 'Summary',
    position_description: 'Position Description',
    financial_info: 'Financial Info',
    posting_content: 'Posting Content',
    general: 'General',
  };
  const tabText = tabTextMap[tabName] || tabName;
  const result = await waitForInFrames(page, `text=${tabText}`, 10000);
  await result.locator.first().click();
  await page.waitForTimeout(2000);
}

async function typeInEditor(page, text) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const editor = frame.locator('body[contenteditable="true"], [contenteditable="true"]');
      const count = await editor.count().catch(() => 0);
      if (count > 0) {
        await editor.first().click();
        await editor.first().fill(text);
        return;
      }
    }
    const mainEditor = page.locator('[contenteditable="true"]');
    const mainCount = await mainEditor.count().catch(() => 0);
    if (mainCount > 0) {
      await mainEditor.first().click();
      await mainEditor.first().fill(text);
      return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Could not find contenteditable editor');
}

// ──────────────────────────────────────────────────────────────────────────────
// Gather email helpers
// ──────────────────────────────────────────────────────────────────────────────

async function selectDefaultGatherTemplate(page) {
  // Find the messaging compose iframe directly by URL to avoid scanning all ~16 frames
  // sequentially with the full timeout on each (which can exceed the total timeout when
  // 'text=Gather' partially matches content in other frames).
  let composeFrame = null;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (frame.url().includes('/messaging/compose')) {
        composeFrame = frame;
        break;
      }
    }
    if (composeFrame) break;
    await page.waitForTimeout(500);
  }

  if (composeFrame) {
    // Use role-based selector to target only the Gather tab button,
    // not other elements containing "Gather" (e.g., job title "Gather Test Posting")
    await composeFrame.getByRole('button', { name: 'Gather', exact: true }).click();
  } else {
    // Fallback to original frame-scanning approach
    await clickInFrames(page, 'text=Gather', 5000);
  }

  await page.waitForTimeout(2000);
  const dropdown = await waitForInFrames(page, 'ng-select', 10000);
  await dropdown.locator.first().click();
  await page.waitForTimeout(1000);
  const option = await waitForInFrames(page, 'text=Default Gather Template', 5000);
  await option.locator.first().click();
  await page.waitForTimeout(1000);
}

async function sendGatherEmail(page, emailBody, timestamp) {
  await waitForInFrames(page, 'text=Recipients:', 10000);
  await selectDefaultGatherTemplate(page);
  await page.waitForTimeout(2000);
  await typeInEditor(page, emailBody);
  const sendBtn = await waitForInFrames(page, 'button#submit', 5000);
  await sendBtn.locator.first().click();
  await page.waitForTimeout(3000);
}

// ──────────────────────────────────────────────────────────────────────────────
// Posting helpers
// ──────────────────────────────────────────────────────────────────────────────

async function createPostingSimple(page, marketData) {
  await page.waitForTimeout(3000);

  const agentField = await findInFrames(page, '#postedBy_input');
  if (agentField) {
    await agentField.locator.click();
    await agentField.locator.clear();
    await agentField.locator.pressSequentially('Automation', { delay: 100 });
    await page.waitForTimeout(2000);
    const option = agentField.frame.locator('div.row:has-text("Automation, Test")').first();
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
    }
    await page.waitForTimeout(500);
  }

  const jobLocSelect = await findInFrames(page, 'select#jobLoc');
  if (jobLocSelect) {
    await jobLocSelect.locator.selectOption({ value: marketData.job_location.value });
  }

  const placementSelect = await findInFrames(page, 'select[name="placementType"], #placementType');
  if (placementSelect) {
    await placementSelect.locator.selectOption({ value: marketData.placement_type.value });
  }

  await switchTab(page, 'posting_content');

  const jobTitleInput = await findInFrames(page, 'input[name="localizedDescription[0].jobTitle"]');
  if (jobTitleInput) {
    await jobTitleInput.locator.clear();
    await jobTitleInput.locator.fill(marketData.job_title);
  }

  const jobLocPosting = await findInFrames(page, 'input[name="localizedDescription[0].cityNeighborhood"]');
  if (jobLocPosting) {
    await jobLocPosting.locator.fill(marketData.job_location_posting);
  }

  const jobDescTextarea = await findInFrames(page, 'textarea[name="jobDescription"], textarea[name="job_description"]');
  if (jobDescTextarea) {
    await jobDescTextarea.locator.fill(marketData.job_description);
  } else {
    await typeInEditor(page, marketData.job_description);
  }

  await clickAsaba(page, 'Save & Post');
  await page.waitForTimeout(3000);
}

// ──────────────────────────────────────────────────────────────────────────────
// Order creation helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new order via the CloudWall UI.
 *
 * IMPORTANT: Register a dialog handler in your test's beforeEach BEFORE calling this:
 *   page.on('dialog', async dialog => { await dialog.accept(); });
 * This is needed because Save triggers browser dialogs that must be auto-accepted.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} marketData - Market data from YAML (e.g., data.new_york)
 * @param {Object} orderData - Additional order config from YAML
 * @param {Object} config - Config with webHost
 * @returns {Promise<string>} The created order ID
 */
async function createOrderSimple(page, marketData, orderData, config) {
  const timestamp = generateTimestamp();

  // Auto-accept browser dialogs (alerts/confirms) — needed for order creation save dialogs
  page.on('dialog', async dialog => {
    console.log(`Dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  // ── Step 1: Navigate to Order module and click New Order ──
  await page.waitForTimeout(3000);
  let clicked = false;
  for (const frame of page.frames()) {
    const orderLink = frame.locator('#order-module');
    const count = await orderLink.count().catch(() => 0);
    if (count > 0) {
      await orderLink.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) throw new Error('Could not find #order-module link');
  await page.waitForTimeout(3000);

  await clickAsaba(page, 'New Order');
  await page.waitForTimeout(3000);

  // ── Step 2: Client Name & Market screen ──
  const marketSelect = await findInFrames(page, 'select#marketList');
  if (marketSelect) {
    await marketSelect.locator.selectOption({ value: marketData.market.value });
    await page.waitForTimeout(500);
  }

  const clientInput = await findInFrames(page, 'input#clientName');
  if (clientInput) {
    await clientInput.locator.click();
    await clientInput.locator.clear();
    await clientInput.locator.pressSequentially(marketData.client.partial_name, { delay: 50 });
    await page.waitForTimeout(2000);
    const clientOption = await waitForInFrames(page, `text=${marketData.client.complete_name}`, 5000);
    await clientOption.locator.first().click();
    await page.waitForTimeout(1000);
  }

  await clickAsaba(page, 'Create Order');
  await page.waitForTimeout(5000);

  // ── Step 3: Summary tab — fill required fields ──

  const startDateInput = await findInFrames(page, 'input#startDate');
  if (startDateInput) {
    const today = new Date();
    const startDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    await startDateInput.locator.fill(startDate);
  }

  const endDateInput = await findInFrames(page, 'input#endDate');
  if (endDateInput) {
    const endDays = marketData.end_date_days || 360;
    const end = new Date();
    end.setDate(end.getDate() + endDays);
    const endDate = `${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}/${end.getFullYear()}`;
    await endDateInput.locator.fill(endDate);
  }

  const billTo = await findInFrames(page, 'select#billTo');
  if (billTo && marketData.contact && marketData.contact.id) {
    await billTo.locator.selectOption({ value: marketData.contact.id });
  }

  const orderedBy = await findInFrames(page, 'select#orderedBy');
  if (orderedBy && marketData.contact && marketData.contact.id) {
    await orderedBy.locator.selectOption({ value: marketData.contact.id });
  }

  const reportTo = await findInFrames(page, 'select#reportTo');
  if (reportTo && marketData.contact && marketData.contact.id) {
    await reportTo.locator.selectOption({ value: marketData.contact.id });
    await page.waitForTimeout(1000);
  }

  const offSitePref = await findInFrames(page, 'select#offSitePreferenceId');
  if (offSitePref) {
    const prefValue = (orderData && orderData.off_site_preference && orderData.off_site_preference.value) || '2';
    await offSitePref.locator.selectOption({ value: prefValue });
  }

  const statusSelect = await findInFrames(page, 'select#orderStatus, select[name="orderStatus"]');
  if (statusSelect && marketData.order_status && marketData.order_status.value) {
    await statusSelect.locator.selectOption({ value: marketData.order_status.value });
  }

  const reasonCreated = await findInFrames(page, 'select#reasonCreated');
  if (reasonCreated) {
    const reasonValue = (orderData && orderData.reason_created && orderData.reason_created.value) || '1';
    await reasonCreated.locator.selectOption({ value: reasonValue });
  }

  const howHeard = await findInFrames(page, 'select#howHeard');
  if (howHeard) {
    const howValue = (orderData && orderData.how_heard && orderData.how_heard.value) || '1033';
    await howHeard.locator.selectOption({ value: howValue });
  }

  // Order Credit
  const creditAgentInput = await findInFrames(page, '#newAgentId_input');
  if (creditAgentInput) {
    const creditName = (orderData && orderData.order_credit && orderData.order_credit.name) || 'Account, VT Test';
    await creditAgentInput.locator.click();
    await creditAgentInput.locator.clear();
    await creditAgentInput.locator.pressSequentially('Account', { delay: 100 });
    await page.waitForTimeout(3000);

    const creditOption = creditAgentInput.frame.locator(`div.row:has-text("${creditName}")`).first();
    if (await creditOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await creditOption.click();
    }

    await creditAgentInput.locator.press('Tab');
    await page.waitForTimeout(1000);

    const percentInput = await findInFrames(page, 'input#newPercentage');
    if (percentInput) {
      await percentInput.locator.click();
      await percentInput.locator.clear();
      await percentInput.locator.pressSequentially('100', { delay: 50 });
      await percentInput.locator.press('Tab');
    }
    await page.waitForTimeout(1000);

    for (const frame of page.frames()) {
      const addBtn = frame.locator('#add-new-credit-icon');
      const count = await addBtn.count().catch(() => 0);
      if (count > 0) {
        await addBtn.click();
        break;
      }
    }
    await page.waitForTimeout(1000);
    await waitForInFrames(page, 'span.agentName', 5000).catch(() => {});
  }

  // ── Step 4: Position Description tab (MUST come before Financial Info) ──
  await switchTab(page, 'position_description');
  await page.waitForTimeout(1000);

  // Dismiss any modal that appears
  const okBtn = await findInFrames(page, 'button:has-text("OK")', 2000);
  if (okBtn) {
    await okBtn.locator.click();
    await page.waitForTimeout(500);
  }

  const posTitle = await findInFrames(page, 'input#title');
  if (posTitle) {
    await posTitle.locator.clear();
    await posTitle.locator.fill(`Auto New Order Title ${timestamp}`);
  }

  const orderInfo = await findInFrames(page, 'textarea#internalOrderInfo');
  if (orderInfo) {
    await orderInfo.locator.fill(`Test Automation Internal Order Info ${timestamp}`);
  }

  const intakeStatus = await findInFrames(page, 'select#orderIntakeStatus');
  if (intakeStatus) {
    await intakeStatus.locator.selectOption({ value: '1' });
  }

  const practiceGroup = await findInFrames(page, 'select#practiceGroupId');
  if (practiceGroup) {
    await practiceGroup.locator.selectOption({ value: '87' });
    await page.waitForTimeout(1000);
  }

  // Practice — find the frame, click "Select Practice", then select option in same frame
  let practiceClicked = false;
  for (const frame of page.frames()) {
    const selectText = frame.locator('text=Select Practice');
    const count = await selectText.count().catch(() => 0);
    if (count > 0) {
      await selectText.first().click();
      await page.waitForTimeout(2000);
      const option = frame.locator('div.select2-result-label:has-text("DEV - Web Developer")');
      const optCount = await option.count().catch(() => 0);
      if (optCount > 0) {
        await option.first().click();
        practiceClicked = true;
      }
      break;
    }
  }
  if (!practiceClicked) {
    const selectText = page.locator('text=Select Practice');
    if (await selectText.count().catch(() => 0) > 0) {
      await selectText.first().click();
      await page.waitForTimeout(2000);
      const option = page.locator('div.select2-result-label:has-text("DEV - Web Developer")');
      if (await option.count().catch(() => 0) > 0) {
        await option.first().click();
      }
    }
  }
  await page.waitForTimeout(500);

  // ── Step 5: Financial Info tab ──
  await switchTab(page, 'Financial Info');
  await page.waitForTimeout(1000);

  const directSelect = await findInFrames(page, 'select#directOrderStatus');
  if (directSelect) {
    const directValue = (marketData.financial_info && marketData.financial_info.direct) || '1';
    await directSelect.locator.selectOption({ value: directValue });
  }

  const exclusiveSelect = await findInFrames(page, 'select#exclusiveOrderStatus');
  if (exclusiveSelect) {
    const exclusiveValue = (marketData.financial_info && marketData.financial_info.exclusive) || '1';
    await exclusiveSelect.locator.selectOption({ value: exclusiveValue });
  }

  const minPayInput = await findInFrames(page, 'input#minPayInput');
  if (minPayInput && marketData.salary_min) {
    await minPayInput.locator.click();
    await minPayInput.locator.fill(String(marketData.salary_min));
    await minPayInput.locator.press('Tab');
  }

  const maxPayInput = await findInFrames(page, 'input#maxPayInput');
  if (maxPayInput && marketData.salary_max) {
    await maxPayInput.locator.click();
    await maxPayInput.locator.fill(String(marketData.salary_max));
    await maxPayInput.locator.press('Tab');
  }

  // ── Step 6: Save ──
  // NOTE: Dialog handler must be registered in beforeEach, not here.
  //       Dialogs like "No job posting will be created" and "pay rates of zero"
  //       fire immediately on Save click and need to be auto-accepted.
  let saved = false;
  for (const frame of page.frames()) {
    const saveBtn = frame.locator('div.ButtonNormal:has-text("Save")');
    const count = await saveBtn.count().catch(() => 0);
    if (count > 0) {
      await saveBtn.first().click();
      saved = true;
      break;
    }
  }
  if (!saved) {
    const saveBtn = page.locator('div.ButtonNormal:has-text("Save")');
    if (await saveBtn.count().catch(() => 0) > 0) {
      await saveBtn.first().click();
    } else {
      throw new Error('Could not find Save button');
    }
  }
  await page.waitForTimeout(5000);

  // ── Step 7: Extract the order ID from the page ──
  let orderId = null;

  const url = page.url();
  const urlMatch = url.match(/orderId=(\d+)|entityId=(\d+)|order\/(\d+)/);
  if (urlMatch) {
    orderId = urlMatch[1] || urlMatch[2] || urlMatch[3];
  }

  if (!orderId) {
    for (const frame of page.frames()) {
      const headerCells = frame.locator('td.pointed, .orderHeader, [id*="orderTitle"]');
      const count = await headerCells.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const text = await headerCells.nth(i).textContent().catch(() => '');
        const match = text.match(/(\d{6,})/);
        if (match) {
          orderId = match[1];
          break;
        }
      }
      if (orderId) break;

      const labels = frame.locator('td.FieldLabel:has-text("Order ID:")');
      const labelCount = await labels.count().catch(() => 0);
      if (labelCount > 0) {
        const parent = labels.first().locator('..');
        const tds = parent.locator('td');
        const tdCount = await tds.count();
        for (let i = 0; i < tdCount; i++) {
          const text = (await tds.nth(i).textContent()).trim();
          if (/^\d{5,}$/.test(text)) {
            orderId = text;
            break;
          }
        }
      }
      if (orderId) break;
    }
  }

  console.log(`Created order: ${orderId}`);
  return orderId;
}

// ──────────────────────────────────────────────────────────────────────────────
// Mailinator email verification helpers
// ──────────────────────────────────────────────────────────────────────────────
 
/**
 * Verifies that gather emails were received via Mailinator API.
 * Polls the Mailinator inbox API until emails are found, then fetches each message
 * and verifies the body contains the expected text.
 *
 * @param {string[]} candidateEmails - Array of candidate email addresses (e.g., ['aquent@muukteam.testinator.com'])
 * @param {string} expectedBodyText - Text to search for in the email body
 * @param {string} apiToken - Mailinator API token
 * @param {Object} [opts={}] - Options
 * @param {number} [opts.timeout=60000] - Max time to wait for emails to arrive (ms)
 * @param {number} [opts.pollInterval=10000] - Time between inbox polls (ms)
 * @param {string} [opts.domain='muukteam.testinator.com'] - Mailinator domain
 * @returns {Promise<Object[]>} Array of { email, found, bodyText } results
 */
async function verifyEmailsViaMailinator(candidateEmails, expectedBodyText, apiToken, opts = {}) {
  if (!apiToken) {
    throw new Error('Mailinator API token is not set. Add mailinator_api_token to configs/test_data.json or export MAILINATOR_API_TOKEN as an environment variable.');
  }

  const timeout = opts.timeout || 60000;
  const pollInterval = opts.pollInterval || 10000;
  const domain = opts.domain || 'muukteam.testinator.com';
  const results = [];

  // For Mailinator + addressing, all emails to aquent+xxx@domain land in the "aquent" inbox.
  // Extract the inbox name (part before + or before @).
  const firstEmail = candidateEmails[0];
  const localPart = firstEmail.split('@')[0];
  const inboxName = localPart.includes('+') ? localPart.split('+')[0] : localPart;

  console.log(`Checking Mailinator inbox: ${inboxName}@${domain} for ${candidateEmails.length} email(s)`);

  const deadline = Date.now() + timeout;
  let matchingBodies = [];

  while (Date.now() < deadline) {
    try {
      const inboxResponse = await fetch(
        `https://mailinator.com/api/v2/domains/${domain}/inboxes/${inboxName}`,
        { headers: { 'Authorization': apiToken } }
      );

      if (!inboxResponse.ok) {
        console.log(`  Mailinator inbox API returned ${inboxResponse.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      const inboxData = await inboxResponse.json();

      if (inboxData.msgs && inboxData.msgs.length > 0) {
        const sortedMsgs = inboxData.msgs.sort((a, b) => b.time - a.time);

        // On first poll, log the most recent subjects so we can see what's in the inbox
        if (!matchingBodies.length && Date.now() - (deadline - timeout) < pollInterval + 2000) {
          const recentSubjects = sortedMsgs.slice(0, 5).map(m => `"${m.subject}" (${new Date(m.time).toISOString()})`);
          console.log(`  Recent inbox messages: ${recentSubjects.join(', ')}`);
        }

        // Only check recent messages (last 10 minutes) with gather-like subjects to avoid
        // fetching all 50+ messages and hitting Mailinator rate limits
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        const candidateMsgs = sortedMsgs.filter(msg => {
          const isRecent = msg.time >= tenMinutesAgo;
          const subject = (msg.subject || '').toLowerCase();
          const isGatherLike = subject.includes('new opportunity') || subject.includes('gather');
          return isRecent && isGatherLike;
        });

        for (const msg of candidateMsgs) {
          const msgResponse = await fetch(
            `https://mailinator.com/api/v2/domains/${domain}/inboxes/${inboxName}/messages/${msg.id}`,
            { headers: { 'Authorization': apiToken } }
          );

          if (!msgResponse.ok) {
            console.log(`  Mailinator message API returned ${msgResponse.status} for ${msg.id}, skipping...`);
            continue;
          }

          const msgData = await msgResponse.json();
          const parts = msgData.parts || [];
          let fullBody = '';
          for (const part of parts) {
            fullBody += part.body || '';
          }

          const subject = msg.subject || msgData.subject || '';

          if (fullBody.includes(expectedBodyText) || subject.includes(expectedBodyText)) {
            matchingBodies.push(fullBody);
            console.log(`  ✓ Found matching email (subject: ${subject})`);
            break;
          } else if (candidateMsgs.indexOf(msg) === 0) {
            // Log a preview of the first gather email's body so we can debug what's actually in it
            const preview = fullBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 300);
            console.log(`  Body preview (first gather email): "${preview}"`);
          }
        }

        if (matchingBodies.length > 0) break;
      }
    } catch (err) {
      console.log(`  API error: ${err.message}`);
    }

    console.log(`  Waiting for gather email in ${inboxName}...`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  // Build results for each candidate email
  for (const email of candidateEmails) {
    if (matchingBodies.length > 0) {
      results.push({ email, found: true, bodyText: matchingBodies[0] });
    } else {
      results.push({ email, found: false, bodyText: '' });
      console.log(`  ✗ No email found containing expected text within ${timeout / 1000}s`);
    }
  }

  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Talent creation via UI
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new talent through the CloudWall UI.
 *
 * Mirrors the original Ruby create_talent flow:
 *   1. Open Talent module → click "New Talent"
 *   2. Enter email + resume → click "Check for Duplicates"
 *   3. Fill in talent fields (first_name, last_name, etc.)
 *   4. Save → dismiss "Create MAT account" modal
 *   5. Capture and return the talent person ID
 *   6. Optionally: fill payroll/benefits, make ready to work
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} talentSetup - The talent_to_setup block from the YAML
 * @param {Object} config - Test config with webHost
 * @param {Object} [options]
 * @param {string} [options.email] - Override email (default: generated via generateRandomTalent)
 * @param {string} [options.firstName] - Override first name
 * @param {string} [options.lastName] - Override last name
 * @param {string} [options.resume] - Resume filename (default: basic_resume.pdf)
 * @returns {Promise<{id: string, email: string, firstName: string, lastName: string}>} The created talent's info
 */
async function createTalentViaUI(page, talentSetup, config, options = {}) {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(4, 14); // MMDDHHmmss
  const randomTalent = generateRandomTalent();
  const talentName = (talentSetup.talent_name || 'CWG Test') + timestamp;
  const email = options.email || randomTalent.email;
  const resume = options.resume !== undefined ? options.resume : 'basic_resume.pdf';

  // Build talent info — merge YAML defaults with generated values
  const talentInfo = { ...(talentSetup.talent_info || {}) };

  // Use provided or random names
  if (!talentInfo.first_name || options.firstName) {
    talentInfo.first_name = options.firstName || randomTalent.firstName;
  }
  if (!talentInfo.last_name || options.lastName) {
    talentInfo.last_name = options.lastName || randomTalent.lastName;
  }

  // Generate remaining fields if not provided
  if (!talentInfo.profile_name) {
    talentInfo.profile_name = `${talentInfo.first_name} ${talentInfo.last_name}`;
  }
  if (!talentInfo.address_1) {
    talentInfo.address_1 = `${talentName} a`;
  }
  if (!talentInfo.professional_title) {
    talentInfo.professional_title = `${talentName} pt`;
  }

  // Generate phone if not provided
  if (!talentInfo.phone) {
    const areaCode = talentInfo.area_code || '617';
    const prefix = Math.floor(Math.random() * 700) + 200;
    const line = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    talentInfo.phone = `${areaCode}${prefix}${line}`;
  }

  // ── Step 1: Navigate to Talent module and click New Talent ──
  // The #talent-module link lives in the navigation frame. After login the frameset
  // may still be loading, so we poll across all frames with a timeout instead of
  // doing a single instant check.
  let clicked = false;
  const navDeadline = Date.now() + 30000;

  while (Date.now() < navDeadline && !clicked) {
    for (const frame of page.frames()) {
      const talentLink = frame.locator('#talent-module');
      const count = await talentLink.count().catch(() => 0);
      if (count > 0 && await talentLink.isVisible().catch(() => false)) {
        await talentLink.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      await page.waitForTimeout(2000);
    }
  }
  if (!clicked) throw new Error('Could not find #talent-module link after 30s — frameset may not have loaded');
  await page.waitForTimeout(3000);

  await clickAsaba(page, 'New Talent');
  await page.waitForTimeout(3000);

  // ── Step 2: Enter email and check for duplicates ──
  // The "New Talent" screen has an email field and a "Check for Duplicates" button
  const emailInput = await findInFrames(page, 'input[name="email"], input#email, input[name="emailAddress"]', 10000);
  if (emailInput) {
    await emailInput.locator.fill(email);
  }

  // Upload resume if available
  if (resume) {
    const fileInput = await findInFrames(page, 'input[type="file"]', 3000);
    if (fileInput) {
      await fileInput.locator.setInputFiles(`data/files/${resume}`);
    }
  }

  // Click "Check for Duplicates" button
  await clickAsaba(page, 'Check for Duplicates');

  // Wait for either the talent edit form (no duplicates) or the "Create Talent" button (duplicates found)
  // Poll because findInFrames returns null (not a rejection) when element isn't found
  const dupCheckDeadline = Date.now() + 60000;
  let formReady = false;

  while (Date.now() < dupCheckDeadline) {
    // Check if duplicate warning appeared
    const createBtn = await findInFrames(page,
      'div.ButtonNormal:has-text("Create Talent"), div.ButtonNormal:has-text("Create New Talent")', 1000);
    if (createBtn) {
      await createBtn.locator.first().click();
      await page.waitForTimeout(2000);
      break;
    }

    // Check if the edit form loaded directly (no duplicates)
    const nameField = await findInFrames(page, 'input[name="firstName"]', 1000);
    if (nameField) {
      formReady = true;
      break;
    }
  }

  // If we clicked "Create Talent", still need to wait for the edit form
  if (!formReady) {
    const nameField = await findInFrames(page, 'input[name="firstName"]', 60000);
    if (!nameField) throw new Error('Talent edit form did not load after Check for Duplicates');
  }

  // ── Step 3: Fill in talent fields on the TalentEditDetail form ──
  // The resume auto-fills most fields (name, address, phone, home market, practices).
  // We only need to:
  //   - Verify/override first name and last name on Summary tab
  //   - Fill Professional Headline on Profile tab

  // Summary tab — override first/last name with our random names
  const firstNameInput = await findInFrames(page, 'input[name="firstName"]', 10000);
  if (firstNameInput) {
    await firstNameInput.locator.clear();
    await firstNameInput.locator.fill(talentInfo.first_name);
  }

  const lastNameInput = await findInFrames(page, 'input[name="lastName"]', 5000);
  if (lastNameInput) {
    await lastNameInput.locator.clear();
    await lastNameInput.locator.fill(talentInfo.last_name);
  }

  // Switch to Profile tab to fill Professional Headline
  const profileTab = await findInFrames(page, 'a:has-text("Profile"), td:has-text("Profile")', 5000);
  if (profileTab) {
    await profileTab.locator.first().click();
    await page.waitForTimeout(2000);
  }

  // Professional Headline (required field on Profile tab)
  const profTitleInput = await findInFrames(page, 'input[name="professional_title"]', 5000);
  if (profTitleInput) {
    await profTitleInput.locator.clear();
    await profTitleInput.locator.fill(talentInfo.professional_title || `${talentInfo.first_name} ${talentInfo.last_name} - QA Tester`);
  }

  // Profile display name (required field on Profile tab)
  const profileNameInput = await findInFrames(page, 'input[name="profile_name"]', 3000);
  if (profileNameInput) {
    await profileNameInput.locator.clear();
    await profileNameInput.locator.fill(talentInfo.profile_name || `${talentInfo.first_name} ${talentInfo.last_name}`);
  }

  // ── Step 4: Save ──
  await clickAsaba(page, 'Save');
  await page.waitForTimeout(3000);

  // Dismiss "Would you like this talent to receive email instructions to set up their MyAquent profile?" modal
  // This is a SweetAlert2 modal on the top-level page (NOT inside an iframe)
  try {
    const noButton = page.locator('.swal2-cancel, button:has-text("No")').first();
    await noButton.waitFor({ state: 'visible', timeout: 5000 });
    await noButton.click();
    await page.waitForTimeout(2000);
  } catch {
    // Modal may not appear — that's fine
  }

  // ── Step 5: Capture the talent ID ──
  // The page URL is like https://cw-pwright.aquent.io/webwall/talent/4179857
  let talentId = null;

  // Primary: extract from the page URL path (/webwall/talent/XXXXXXX)
  const pageUrl = page.url();
  const urlPathMatch = pageUrl.match(/\/talent\/(\d+)/);
  if (urlPathMatch) {
    talentId = urlPathMatch[1];
  }

  // Fallback: check all frame URLs for the same pattern
  if (!talentId) {
    for (const frame of page.frames()) {
      try {
        const frameUrl = frame.url();
        const match = frameUrl.match(/\/talent\/(\d+)/) || frameUrl.match(/personId=(\d{6,})/i) || frameUrl.match(/entityID=(\d{6,})/i);
        if (match) {
          talentId = match[1];
          break;
        }
      } catch { /* frame may be detached */ }
    }
  }

  if (!talentId) {
    throw new Error('Could not extract talent ID after creation');
  }

  console.log(`Created talent: ${talentId} (${talentInfo.first_name} ${talentInfo.last_name}) with email: ${email}`);

  // ── Step 6: Make Ready to Work (if configured) ──
  // Use DB instead of UI — the "Change Status" button (AWUIDrawTalentChangeStatus) is only
  // available on the View page, and after saving we may still be on the Edit page.
  // setTalentAsRTW inserts person_role records and updates employee_status_id via SQL.
  if (talentSetup.make_ready_to_work) {
    const { setTalentAsRTW } = require('../cloudwall/talent_sql_util');
    const marketId = talentInfo.home_market_selector || 11;
    await setTalentAsRTW(talentId, { market_id: marketId });
    console.log(`  RTW set via DB for talent ${talentId} (market ${marketId})`);
  }

  return { id: talentId, email, firstName: talentInfo.first_name, lastName: talentInfo.last_name };
}

module.exports = {
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
  verifyEmailsViaMailinator,
  createTalentViaUI,
  generateRandomTalent,
};