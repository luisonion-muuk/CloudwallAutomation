const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Order Purchase Order modal.
 */
class OrderPurchaseOrderModal extends Bootstrap2Modal {

  static LOCATORS = {
    loading:            '.loader-container',
    saveButton:         '#save-purchase-order',
    poNumberInput:      '#po_poNumber',
    poExpirationInput:  '#po_expDate',
    amountInput:        '#po_maxAmt',
    validationErrorDiv: '#poModal_validation',
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
    await this.root.locator(OrderPurchaseOrderModal.LOCATORS.loading)
      .waitFor({ state: 'hidden', timeout: 60000 });
  }

  /**
   * Clicks the Save button to submit the modal.
   */
  async submit() {
    await this.root.locator(OrderPurchaseOrderModal.LOCATORS.saveButton).click();
  }
}

module.exports = { OrderPurchaseOrderModal };
