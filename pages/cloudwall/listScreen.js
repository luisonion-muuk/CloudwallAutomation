// @ts-check

/**
 * Page object for the CloudWall ListScreen — a generic list/grid view.
 * Maps to the Ruby CloudWall::ListScreen class.
 */
class ListScreen {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    /** @type {import('@playwright/test').Page} */
    this.page = page;

    // TODO: Replace with the real selector that identifies a ListScreen.
    this.rootLocator = page.locator('.list-screen, #listScreen');
  }
}

module.exports = { ListScreen };