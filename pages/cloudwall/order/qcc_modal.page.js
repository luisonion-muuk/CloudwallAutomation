const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the QCC (Quality Client Check) modal.
 */
class QCCModal extends Bootstrap2Modal {

  static LOCATORS = {
    loading:          '.loader-container',
    talentRating5:    '#talent-rating-5',
    talentFeedback:   '[name="talentFeedback"]',
    companyRating4:   '#company-rating-4',
    companyFeedback:  '[name="companyFeedback"]',
    additionalNotes:  '[name="notes"]',
    cancelButton:     '//*[@id="qcc-form-modal"]//button[contains(text(), "Cancel")]',
    saveButton:       '//*[@id="qcc-form-modal"]//button[contains(text(), "Submit")]',
    errorMessage:     '#talentRating-error',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Waits for the loading indicator to disappear.
   */
  async waitForLoad() {
    await this.root.locator(QCCModal.LOCATORS.loading)
      .waitFor({ state: 'hidden', timeout: 60000 });
  }

  /**
   * Clicks the Submit button.
   */
  async clickSubmit() {
    await this.root.locator(QCCModal.LOCATORS.saveButton).click();
  }

  /**
   * Fills in all QCC fields with default values and submits.
   */
  async enterManualQcc() {
    await this.root.locator(QCCModal.LOCATORS.talentRating5).click();
    await this.root.locator(QCCModal.LOCATORS.talentFeedback).fill('some talent feed back');
    await this.root.locator(QCCModal.LOCATORS.companyRating4).click();
    await this.root.locator(QCCModal.LOCATORS.companyFeedback).fill('some company feedback');
    await this.root.locator(QCCModal.LOCATORS.additionalNotes).fill('some additional notes');
    await this.root.locator(QCCModal.LOCATORS.saveButton).click();
  }
}

module.exports = { QCCModal };
