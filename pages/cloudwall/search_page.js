/**
 * Base class for CloudWall Search Pages.
 *
 * Migrated from the Ruby CloudWall::SearchPage class.
 * Provides common search operations like running queries and selecting results.
 */
class SearchPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.rootLocator = page.locator('#searchPage, .search-page');
  }

  /**
   * Clicks the Go/Search button.
   */
  async clickGo() {
    const goBtn = this.page.locator('#go-button, button:has-text("Go"), input[value="Go"]');
    await goBtn.first().click();
  }
}

module.exports = { SearchPage };
