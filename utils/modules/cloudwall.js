// cloudwall.js

const { expect } = require('@playwright/test');

const CONTEXT_PATH = '';
const SERVLET_PATH = '/webwall';
const SESSION_COOKIE_NAME = 'CWSESSIONID';
const CW_DOMAIN = (process.env.SERVER_HOST || '').split('.')[0];
const SERVER_HOST = process.env.SERVER_HOST || '';

/**
 * Frame name mappings for CloudWall page objects.
 * Maps spec variable names to frame IDs/names.
 */
const PAGE_MAPPINGS = {
  main_page: 'mainFrame',
  search_top_page: 'topFrame',
  results_page: 'resultsFrame',
  todo_area_list: 'sal_TalentToDos',
  activity_history_page_talent: 'sal_Talent_ActivityHistory',
  activity_history_page_order: 'sal_Activity',
  activity_history_page_contact: 'sal_Contact_ActivityHistory',
  activity_history_contact_snapshot: 'sal_AHLast2Weeks',
  activity_history_client_snapshot: 'sal_TwoWeekActivityHistory',
  activity_history: 'sal_ActivityHistory',
  work_history_page: 'sal_TalentDetail_WorkHistory',
  current_future_jobs_page: 'sal_TalentDetail_CurrentFutureJobs',
  contacts_on_client_detail: 'sal_Contacts',
  filled_orders_area_list: 'sal_filledOrders',
  unfilled_orders_area_list: 'sal_unfilledOrders',
  closed_orders_area_list: 'sal_closedOrders',
  invoices_area_list: 'sal_invoices',
  client_statement_invoice_list: 'sal_Invoices',
  splash_screen_to_do: 'smf_1',
  current_candidates: 'CurrentCandidatesFrame',
  paper_timecards_list: 'UnapprovedPaperTimecardsFrame',
  mac_timecards_list: 'UnapprovedOnlineTimecardsFrame',
  imported_timecards_list: 'UnapprovedVmsTimecardsFrame',
  fees_list: 'UnapprovedFeeListFrame',
  approved_list: 'approvedFrame',
  order_search_page: 'talentOrderSearch',
  destination_order_search: 'destinationOrderSearch',
  possible_candidates: 'PossibleCandidatesFrame',
  order_fees: 'FeeListFrame',
  contact_detail_page: 'contact-detail',
  aquents_book_page: 'AquentsBook',
  benefits_activity_history: 'benefits_activity_history',
};

// ---- Session cookie storage (in-memory, shared across tests in same process) ----
const sessionCookies = {};

function clearSessionCache() {
  for (const key of Object.keys(sessionCookies)) {
    delete sessionCookies[key];
  }
}

// =====================
//  CloudWall Util
// =====================

/**
 * Builds a base URL from config.
 *
 * @param {string} [urlPath=''] - Path to append
 * @param {Object} config - Config object with webHost
 * @returns {string}
 */
function baseUrl(urlPath = '', config) {
  const host = config.webHost || SERVER_HOST;
  return `https://${host}${CONTEXT_PATH}${urlPath}`;
}

/**
 * Builds a servlet URL.
 *
 * @param {string} [urlPath=''] - Path to append after servlet path
 * @param {Object} config - Config object
 * @returns {string}
 */
function servletUrl(urlPath = '', config) {
  return baseUrl(`${SERVLET_PATH}${urlPath}`, config);
}

/**
 * Gets a frame locator for a named page mapping.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} mappingName - Key from PAGE_MAPPINGS
 * @param {number} [windowIndex=0] - Window/tab index for multi-window tests
 * @returns {import('@playwright/test').FrameLocator|import('@playwright/test').Frame|null}
 */
function getFrame(page, mappingName) {
  const frameName = PAGE_MAPPINGS[mappingName];
  if (!frameName) return null;
  return page.frame(frameName) || page.frameLocator(`[name="${frameName}"]`);
}

/**
 * Visits a URL or page and logs in if needed.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 * @param {string} [pageUrl=null] - URL to visit (defaults to frameset)
 */
async function visitAndLogin(page, config, pageUrl = null) {
  const url = pageUrl || servletUrl('', config);
  const username = config.agentUserName;

  await restoreCookies(page, username, config);
  await page.goto(url);

  // Check if we landed on the login page
  if (await _isLoginPage(page)) {
    const legacyLoginUrl = servletUrl('?PROC=AWUIDrawCloudWallLogin', config);
    await page.goto(legacyLoginUrl);
    await _performLogin(page, config);
    await storeCookies(page, username);
  }

  await checkGoogleAuth(page, config);
}

/**
 * Visits a URL or page and logs in as a specified user.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} username - Username to log in as
 * @param {Object} config - Config object
 * @param {string} [pageUrl=null] - URL to visit
 */
async function visitAndLoginAs(page, username, config, pageUrl = null) {
  const url = pageUrl || servletUrl('', config);

  await restoreCookies(page, username, config);
  await page.goto(url);

  if (await _isLoginPage(page)) {
    const legacyLoginUrl = servletUrl('/login', config);
    await page.goto(legacyLoginUrl);
    await _performLogin(page, config);

    // Switch user
    const switchUserUrl = servletUrl(`/switchUser?user=${username}`, config);
    await page.goto(switchUserUrl);
    await storeCookies(page, username);

    // Check for unauthorized
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('HTTP Status 401')) {
      const currentUrl = page.url();
      throw new Error(`Unauthorized user - ${currentUrl.split('=')[1]}`);
    }

    await page.goto(url);
  }

  await checkGoogleAuth(page, config);
}

/**
 * Visits a URL and logs in as an expert interviewer.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} username - Expert interviewer username
 * @param {Object} config - Config object
 * @param {string} [pageUrl=null] - URL to visit
 */
async function visitAndLoginAsExpertInterviewer(page, username, config, pageUrl = null) {
  const url = pageUrl || servletUrl('', config);

  await restoreCookies(page, username, config);
  await page.goto(url);

  if (await _isLoginPage(page)) {
    const legacyLoginUrl = servletUrl('/login', config);
    await page.goto(legacyLoginUrl);
    await _performLogin(page, config);

    const switchUserUrl = servletUrl(`/switchUser?user=${username}`, config);
    await page.goto(switchUserUrl);
    await storeCookies(page, username);
  }

  // Expect ExpertInterview page
}

/**
 * Masquerades as a new/different user. Assumes already logged in to CloudWall.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} username - Username to masquerade as
 * @param {Object} config - Config object
 * @param {string} [pageUrl=null] - URL to visit after switching
 */
async function masqueradeAsNewUser(page, username, config, pageUrl = null) {
  const url = pageUrl || servletUrl('', config);

  await restoreCookies(page, username, config);

  const switchUserUrl = servletUrl(`/switchUser?user=${username}`, config);
  await page.goto(switchUserUrl);
  await storeCookies(page, username);

  const bodyText = await page.locator('body').textContent();
  if (bodyText.includes('HTTP Status 401')) {
    throw new Error(`Unauthorized user - ${page.url().split('=')[1]}`);
  }

  await page.goto(url);
  await checkGoogleAuth(page, config);
}

/**
 * Logs in and navigates to a talent detail page.
 *
 * @param {Object} talentData - Object with person_id
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 */
async function loginAndNavigateTalentDetail(talentData, page, config) {
  const url = servletUrl(`/talentDetail?personId=${talentData.person_id}`, config);
  await visitAndLogin(page, config, url);
  // expect Frameset and TalentDetail
}

/**
 * Logs in and navigates to a talent snapshot edit page.
 *
 * @param {Object} talentData - Object with person_id
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 * @param {Object} context - Object containing page objects
 */
async function loginAndNavigateSnapshotEdit(talentData, page, config, context) {
  const url = servletUrl(`/talentDetail?personId=${talentData.person_id}`, config);
  await visitAndLogin(page, config, url);
  // expect Frameset and TalentDetail
  await context.mainPage.clickAsaba('AWUIDrawTalentEditPlacementInfo');
  // expect TalentEditDetail
}

/**
 * Restores CloudWall session cookies for the specified username.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} username - Username to restore cookies for
 * @param {Object} config - Config object
 */
async function restoreCookies(page, username, config) {
  const cookie = sessionCookies[username];
  if (cookie) {
    console.log(`Reusing session cookie for ${username} | ${cookie.name}=${cookie.value}`);

    // Must be on the correct domain to set cookies
    const currentUrl = page.url();
    if (!currentUrl.includes(SERVER_HOST)) {
      await page.goto(baseUrl('/html/blank.html', config));
    }

    const context = page.context();
    // Delete existing session cookie
    await context.clearCookies({ name: SESSION_COOKIE_NAME });
    // Add stored cookie
    await context.addCookies([cookie]);
  }
}

/**
 * Stores CloudWall session cookies for the specified username.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} username - Username to store cookies for
 */
async function storeCookies(page, username) {
  const context = page.context();
  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === SESSION_COOKIE_NAME);

  if (sessionCookie) {
    console.log(`Storing session cookie for ${username} | ${sessionCookie.name}=${sessionCookie.value}`);
    sessionCookies[username] = {
      ...sessionCookie,
      sameSite: 'None',
    };
  }
}

/**
 * Checks CloudWall Google authorization and completes the flow if needed.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 */
async function checkGoogleAuth(page, config) {
  try {
    const emailProviderDialog = page.locator('#email-provider-dialog, [data-testid="email-provider-dialog"]');
    const isVisible = await emailProviderDialog.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await page.locator('#connect-to-google, [data-testid="connect-to-google"]').click();

      // Handle Google login in popup
      const [popup] = await Promise.all([
        page.context().waitForEvent('page'),
      ]);
      await popup.waitForLoadState();

      // Handle Google login flow
      const googleEmailInput = popup.locator('input[type="email"]');
      if (await googleEmailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await googleEmailInput.fill(config.googleUsername);
        await popup.locator('#identifierNext, [data-testid="identifierNext"]').click();
        await popup.waitForLoadState();

        const googlePasswordInput = popup.locator('input[type="password"]');
        if (await googlePasswordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await googlePasswordInput.fill(config.googlePassword);
          await popup.locator('#passwordNext, [data-testid="passwordNext"]').click();
        }
      }

      // Accept/authorize if needed
      const allowButton = popup.locator('button:has-text("Allow"), button:has-text("Continue")');
      if (await allowButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await allowButton.click();
      }

      // Wait for popup to close or click confirm
      try {
        await popup.waitForEvent('close', { timeout: 10000 });
      } catch {
        const confirmButton = popup.locator('#confirm-button, [data-testid="confirm"]');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    }
  } catch {
    // No Google auth dialog present; continue normally
  }
}

// =====================
//  ManageCandidatesUtil
// =====================

/**
 * Navigates to manage candidates for the specified order.
 *
 * @param {string} orderId - The order ID
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 * @param {Object} context - Object containing page objects
 */
async function visitManageCandidates(orderId, page, config, context) {
  const url = servletUrl(`/orderDetail?orderId=${orderId}`, config);
  await page.goto(url);
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

  await context.mainPage.clickAsaba('AWUIDrawManageCandidates');
  // expect(context.mainPage).toBeInstanceOf('ManageCandidates');
}

/**
 * Navigates to manage candidates for a talent pool.
 *
 * @param {string} orderId - The pool/order ID
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} config - Config object
 * @param {Object} context - Object containing page objects
 */
async function visitManageCandidatesForPool(orderId, page, config, context) {
  const url = servletUrl(`/orderDetail?orderId=${orderId}`, config);
  await page.goto(url);
  // expect(context.mainPage).toBeInstanceOf('TalentPoolViewActionScreen');

  await context.mainPage.clickAsaba('AWUIDrawManageCandidates');
  // expect(context.mainPage).toBeInstanceOf('ManageCandidates');
}

/**
 * Navigates to the candidate info / talent board.
 *
 * @param {Object} context - Object containing page objects (topPage)
 */
async function visitCandidateInfo(context) {
  await context.topPage.openModule('talentboard');
  // expect(context.mainPage).toBeInstanceOf('RedeployBoardModulePage');
}

// =====================
//  CandidateStagesUtil
// =====================

/**
 * Pops out the framed candidate stages into a direct URL.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The candidate stages URL
 */
async function popoutFramedCandidateStages(page, context) {
  const frame = await context.mainPage.find('candidate_stages_frame');
  const url = await frame.getAttribute('src');
  await page.goto(url);
  // Wait for CandidateStages page
  await page.waitForLoadState('networkidle');
  return url;
}

/**
 * Switches into the candidate stages iframe.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {import('@playwright/test').Frame} The candidate stages frame
 */
function switchToStagesFrame(page) {
  return page.frameLocator('#CandidateStages');
}

/**
 * Switches back to the default/main content from an iframe.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function switchBackToDefaultContent(page) {
  // In Playwright, the page object always represents the main frame.
  // Frame locators are scoped — just stop using the frameLocator to return to main content.
  // No explicit action needed, but we can trigger a frame update if using a custom driver.
}

// =====================
//  AquentsBookUtil
// =====================

/**
 * Opens the Aquent's Book module.
 *
 * @param {Object} context - Object containing page objects
 */
async function visitAquentsBookModule(context) {
  await context.topPage.openModule('aquents_book');
  // expect(context.mainPage).toBeInstanceOf('AquentsBookModulePage');
}

/**
 * Opens the Redeploy Board module.
 *
 * @param {Object} context - Object containing page objects
 */
async function visitRedeployBoardModule(context) {
  await context.topPage.openModule('talentboard');
  // expect(context.mainPage).toBeInstanceOf('RedeployBoardModulePage');
}

/**
 * Pops out the framed Aquent's Book using the iframe src URL.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The Aquent's Book URL
 */
async function popoutFramedAquentsBook(page, context) {
  const frame = await context.mainPage.find('aquents_book_frame');
  const url = await frame.getAttribute('src');
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return url;
}

/**
 * Pops out the framed Redeploy Board with cache=false.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function popoutFramedRedeployBoardNoCache(page, context) {
  const frame = await context.mainPage.find('redeploy_board_frame');
  const url = await frame.getAttribute('src');
  await page.goto(url + '?cache=false');
  await page.waitForLoadState('networkidle');
}

/**
 * Gets the framed Redeploy Board URL.
 *
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>}
 */
async function getFramedRedeployBoardUrl(context) {
  const frame = await context.mainPage.find('redeploy_board_frame');
  return await frame.getAttribute('src');
}

/**
 * Gets the framed Redeploy Board URL with cache=false.
 *
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>}
 */
async function getFramedRedeployBoardNoCacheUrl(context) {
  const frame = await context.mainPage.find('redeploy_board_frame');
  const url = await frame.getAttribute('src');
  return url + '?cache=false';
}

/**
 * Pops out the framed Redeploy Board.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function popoutFramedRedeployBoard(page, context) {
  const frame = await context.mainPage.find('redeploy_board_frame');
  const url = await frame.getAttribute('src');
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// =====================
//  Support class
// =====================

/**
 * Support class for cross-module tests.
 * Provides access to CloudWall utils with a specific page/context.
 */
class CloudWallSupport {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page
   * @param {Object} config - Config object
   * @param {number} [windowIndex=0] - Window/tab index for multi-window tests
   */
  constructor(page, config, windowIndex = 0) {
    this.page = page;
    this.config = config;
    this.windowIndex = windowIndex;
  }

  /**
   * Gets a frame by mapping name.
   *
   * @param {string} mappingName - Key from PAGE_MAPPINGS
   * @returns {import('@playwright/test').Frame|import('@playwright/test').FrameLocator|null}
   */
  getFrame(mappingName) {
    return getFrame(this.page, mappingName);
  }

  async visitAndLogin(pageUrl = null) {
    return await visitAndLogin(this.page, this.config, pageUrl);
  }

  async visitAndLoginAs(username, pageUrl = null) {
    return await visitAndLoginAs(this.page, username, this.config, pageUrl);
  }
}

// ---- Private helpers ----

/**
 * Checks if the current page is a login page.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 * @private
 */
async function _isLoginPage(page) {
  try {
    const loginForm = page.locator('form#loginForm, input#username, #login-form');
    const pageNotExist = page.locator('text=Page Does Not Exist');
    const isLogin = await loginForm.isVisible({ timeout: 3000 }).catch(() => false);
    const isError = await pageNotExist.isVisible({ timeout: 1000 }).catch(() => false);
    return isLogin || isError;
  } catch {
    return false;
  }
}

/**
 * Performs login on the login page.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} config
 * @private
 */
async function _performLogin(page, config) {
  // Accept cookies checkbox (check it if unchecked)
  const cookieCheckbox = page.locator('#cookieAgreement');
  if (await cookieCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (!(await cookieCheckbox.isChecked())) {
      await cookieCheckbox.check();
    }
  }

  // Fill in credentials and submit
  await page.locator('#j_username').fill(config.agentUserName);
  await page.locator('#j_password').fill(config.agentPassword);
  await page.locator('#login-submit').click();
  await page.waitForLoadState('networkidle');
}

module.exports = {
  // Constants
  CONTEXT_PATH,
  SERVLET_PATH,
  SESSION_COOKIE_NAME,
  CW_DOMAIN,
  SERVER_HOST,
  PAGE_MAPPINGS,

  // URL helpers
  baseUrl,
  servletUrl,
  getFrame,

  // Auth / navigation
  visitAndLogin,
  visitAndLoginAs,
  visitAndLoginAsExpertInterviewer,
  masqueradeAsNewUser,
  loginAndNavigateTalentDetail,
  loginAndNavigateSnapshotEdit,
  restoreCookies,
  storeCookies,
  checkGoogleAuth,
  clearSessionCache,

  // ManageCandidatesUtil
  visitManageCandidates,
  visitManageCandidatesForPool,
  visitCandidateInfo,

  // CandidateStagesUtil
  popoutFramedCandidateStages,
  switchToStagesFrame,
  switchBackToDefaultContent,

  // AquentsBookUtil
  visitAquentsBookModule,
  visitRedeployBoardModule,
  popoutFramedAquentsBook,
  popoutFramedRedeployBoardNoCache,
  getFramedRedeployBoardUrl,
  getFramedRedeployBoardNoCacheUrl,
  popoutFramedRedeployBoard,

  // Support class
  CloudWallSupport,
};
