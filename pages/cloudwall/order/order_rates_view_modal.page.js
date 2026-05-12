const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Order Rates View (history) modal.
 */
class OrderRatesViewModal extends Bootstrap2Modal {

  static LOCATORS = {
    closeButton: '#rate-history-modal-close',
    rateRow:     '//*[@id="rate-history-modal-body"]/table/tbody/tr[contains(@class, "rate-row")]',
  };

  /**
   * Returns the XPath selector for a cell in the rate history table.
   * Row index is 1-based (row 1 = first data row, which is tr[3] in the table).
   *
   * @param {number} row - 1-based row index
   * @param {number} col - 1-based column index
   * @returns {string}
   * @private
   */
  static _cellSelector(row, col) {
    return `//*[@id="rate-history-modal-body"]/table/tbody/tr[${row + 2}]/td[${col}]`;
  }

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  // --- Generic row accessors (1-based row index) ---

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getStartDate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 1)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getEndDate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 2)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getRegularPayRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 3)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getOvertimePayRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 4)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getDoublePayRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 5)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getRegularBillRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 6)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getOvertimeBillRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 7)).textContent();
  }

  /**
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getDoubleBillRate(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 8)).textContent();
  }

  /**
   * Note: The generic row_i_mark_up in the original used column 10, while the
   * fixed row locators used column 9. This preserves the generic method's column 10.
   *
   * @param {number} row
   * @returns {Promise<string>}
   */
  async getMarkUp(row) {
    return this.root.locator(OrderRatesViewModal._cellSelector(row, 10)).textContent();
  }

  /**
   * Counts the number of rate rows in the table.
   *
   * @returns {Promise<number>}
   */
  async countRows() {
    return this.root.locator(OrderRatesViewModal.LOCATORS.rateRow).count();
  }

  /**
   * Collects all rate values for a given row into an array.
   * Order: startDate, regPayRate, otPayRate, dtPayRate, regBillRate, otBillRate, dtBillRate, markUp, endDate
   *
   * @param {number} row - 1-based row index
   * @returns {Promise<string[]>}
   */
  async getRateValuesByRow(row) {
    return [
      await this.getStartDate(row),
      await this.getRegularPayRate(row),
      await this.getOvertimePayRate(row),
      await this.getDoublePayRate(row),
      await this.getRegularBillRate(row),
      await this.getOvertimeBillRate(row),
      await this.getDoubleBillRate(row),
      await this.getMarkUp(row),
      await this.getEndDate(row),
    ];
  }

  /**
   * Closes the modal.
   */
  async closeModal() {
    await this.root.locator(OrderRatesViewModal.LOCATORS.closeButton).click();
  }
}

module.exports = { OrderRatesViewModal };
