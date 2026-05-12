const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the "Add New Rates" modal.
 */
class AddNewRatesModal extends Bootstrap2Modal {

  static LOCATORS = {
    hoursPerWeek:              '#hoursPerWeek',
    otRatio:                   '#OTRatio',
    markUp:                    '#hourlyMarkupNode',
    regularPayRate:            '#regularPayRate',
    otPayRate:                 '#OTPayRate',
    doublePayRate:             '#doubletimePayRate',
    regularBillRate:           '#regularBillRate',
    otBillRate:                '#OTBillRate',
    doubleBillRate:            '#doubletimeBillRate',
    effectiveStartDateInput:   '#adjustmentWeekStartingMonday',
    cancel:                    '#cancelButtonOrderRates',
    saveRates:                 '#saveButtonOrderRates',
    payTalentOvertimeYes:      '#payTalentOvertimeYes',
    payTalentOvertimeNo:       '#payTalentOvertimeNo',
    billClientForOvertimeYes:  '#billClientForOvertimeYes',
    billClientForOvertimeNo:   '#billClientForOvertimeNo',
    deleteRate:                '#deleteButtonOrderRates',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Clears and enters a rate value into the specified field.
   *
   * @param {string} locatorKey - A key from LOCATORS
   * @param {string|number} rate - The rate value to enter
   */
  async enterRate(locatorKey, rate) {
    const field = this.root.locator(AddNewRatesModal.LOCATORS[locatorKey]);
    await field.click();
    await field.fill(String(rate));
    await field.press('Tab');
  }

  /**
   * Clicks the Cancel button.
   */
  async cancel() {
    await this.root.locator(AddNewRatesModal.LOCATORS.cancel).click();
  }

  /**
   * Clicks the Save Rates button.
   */
  async save() {
    await this.root.locator(AddNewRatesModal.LOCATORS.saveRates).click();
  }

  /**
   * Clicks the Delete Rate button, ensuring the viewport is large enough for the button to be visible.
   */
  async deleteRate() {
    const page = this.root.page();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await this.root.locator(AddNewRatesModal.LOCATORS.deleteRate).click();
  }

  /**
   * Sets the "Pay Talent Overtime" radio option.
   *
   * @param {boolean} value - true for Yes, false for No
   */
  async payTalentOvertime(value) {
    const yesButton = this.root.locator(AddNewRatesModal.LOCATORS.payTalentOvertimeYes);
    if (await yesButton.isVisible()) {
      const page = this.root.page();
      await page.setViewportSize({ width: 1920, height: 1080 });
      const locator = value
        ? AddNewRatesModal.LOCATORS.payTalentOvertimeYes
        : AddNewRatesModal.LOCATORS.payTalentOvertimeNo;
      await this.root.locator(locator).click();
    }
  }

  /**
   * Sets the "Bill Client for Overtime" radio option.
   *
   * @param {boolean} value - true for Yes, false for No
   */
  async billClientOvertime(value) {
    const yesButton = this.root.locator(AddNewRatesModal.LOCATORS.billClientForOvertimeYes);
    if (await yesButton.isVisible()) {
      const locator = value
        ? AddNewRatesModal.LOCATORS.billClientForOvertimeYes
        : AddNewRatesModal.LOCATORS.billClientForOvertimeNo;
      await this.root.locator(locator).click();
    }
  }

  /**
   * Sets the effective start date by calculating a Monday a given number of weeks out.
   *
   * @param {number} weeksOut - Number of weeks from the nearest Monday
   */
  async setEffectiveDateByWeeksOut(weeksOut) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek <= 1 ? 0 : 8 - dayOfWeek);
    const nearestMonday = new Date(today);
    nearestMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    if (nearestMonday > today) {
      nearestMonday.setDate(nearestMonday.getDate() - 7);
    }
    nearestMonday.setDate(nearestMonday.getDate() + weeksOut * 7);

    await this._fillDateField(nearestMonday);
  }

  /**
   * Sets the effective start date to a specific date.
   *
   * @param {Date} date
   */
  async setEffectiveDateByDate(date) {
    await this._fillDateField(date);
  }

  /**
   * Clears and fills the effective start date input with a formatted date string (MM/DD/YYYY).
   *
   * @param {Date} date
   * @private
   */
  async _fillDateField(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${month}/${day}/${year}`;

    const field = this.root.locator(AddNewRatesModal.LOCATORS.effectiveStartDateInput);
    await field.click();
    await field.fill(formatted);
    await field.press('Tab');
  }
}

module.exports = { AddNewRatesModal };
