/**
 * Page object for the CloudWall Frameset — the main container page after login.
 *
 * Maps to the Ruby CloudWall::Frameset class. The original framework detected the
 * current page type automatically via URL/proc mappings; in Playwright we instantiate
 * page objects explicitly and verify presence via rootLocator.
 */
class Frameset {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    /** @type {import('@playwright/test').Page} */
    this.page = page;

    // The main CloudWall page after login uses <body id="navBody">
    this.rootLocator = page.locator('body#navBody');
  }

  /** Read the window key that CloudWall assigns to the session. */
  async getWinkey() {
    return this.page.evaluate(() => window.getWinKey ? window.getWinKey() : null);
  }

  /** Read the logged-in username displayed on the page. */
  async getUsername() {
    return this.page.evaluate(() => window.cwUsername ?? null);
  }

  /** Read the logged-in user's person ID. */
  async getUserPersonId() {
    return this.page.evaluate(() => String(window.cwPersonId ?? ''));
  }

  /** Read the logged-in user's email. */
  async getUserEmail() {
    return this.page.evaluate(() => window.cwEmail ?? null);
  }

  /**
   * Open a CloudWall module (e.g. 'talent', 'order', 'contacts', 'clients', 'payroll', 'invoices', 'reports').
   * Module links have IDs like #talent-module, #order-module, #contacts-module, etc.
   * Maps to the Ruby `top_page.open_module :talent`.
   * @param {string} moduleName
   */
  async openModule(moduleName) {
    await this.page.locator(`#${moduleName}-module`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the main content iframe.
   * @returns {import('@playwright/test').FrameLocator}
   */
  getMainFrame() {
    return this.page.frameLocator('#mainFrame');
  }
}

module.exports = { Frameset };