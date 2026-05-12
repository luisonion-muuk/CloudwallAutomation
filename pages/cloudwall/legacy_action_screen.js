// @ts-check

/**
 * Page object for a CloudWall LegacyActionScreen.
 * Maps to the Ruby CloudWall::LegacyActionScreen class.
 */
class LegacyActionScreen {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    /** @type {import('@playwright/test').Page} */
    this.page = page;

    // TODO: Replace with the real selector that identifies a LegacyActionScreen.
    this.rootLocator = page.locator('.legacy-action-screen, #actionScreen');
  }

  /**
   * Named selectors — add entries here as you migrate more tests.
   * @type {Record<string, string>}
   */
  static SELECTORS = {
    logoutLink: 'a#logout, a:has-text("Logout"), a:has-text("Log Out")',
    // TODO: Add other named selectors as needed.
  };

  /**
   * Click a named element on the screen.
   * Maps to the Ruby pattern: `search_top_page.click :logout_link`
   * @param {string} locatorName — camelCase key, e.g. 'logoutLink'
   */
  async click(locatorName) {
    const selector = LegacyActionScreen.SELECTORS[locatorName];
    if (!selector) {
      throw new Error(`LegacyActionScreen: unknown locator "${locatorName}"`);
    }
    await this.page.locator(selector).click();
  }
}

module.exports = { LegacyActionScreen };