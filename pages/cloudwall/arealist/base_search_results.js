/**
 * Base class for CloudWall search result area lists.
 *
 * Migrated from the Ruby CloudWall::BaseSearchResults class.
 * Provides column type constants and common table operations.
 */

const INT_COLUMN = 'int';
const TEXT_COLUMN = 'text';
const FLOAT_COLUMN = 'float';

class BaseSearchResults {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Selects a row by its 1-based row number.
   *
   * @param {number} rowNumber - 1-based row index
   */
  async selectRowNumber(rowNumber) {
    const row = this.page.locator(`tr[data-key]`).nth(rowNumber - 1);
    await row.click();
  }

  /**
   * Gets the number of rows in the result set.
   *
   * @returns {Promise<number>}
   */
  async rowCount() {
    return this.page.locator('tr[data-key]').count();
  }
}

module.exports = { BaseSearchResults, INT_COLUMN, TEXT_COLUMN, FLOAT_COLUMN };
