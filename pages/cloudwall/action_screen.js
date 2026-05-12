/**
 * Base class for CloudWall Action Screens.
 *
 * Migrated from the Ruby CloudWall::ActionScreen class.
 * Provides common operations for screens with ASABA action links and tab navigation.
 */
class ActionScreen {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.rootLocator = page.locator('#actionScreen, .action-screen');
  }

  /**
   * Clicks an ASABA action link by name.
   *
   * @param {string} actionName
   */
  async clickAsaba(actionName) {
    const link = this.page.locator(`a[name="${actionName}"]`);
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      return;
    }
    const button = this.page.locator(`div.ButtonNormal:has-text("${actionName}")`);
    await button.click();
  }
}

module.exports = { ActionScreen };
