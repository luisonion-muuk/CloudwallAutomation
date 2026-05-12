const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Order Invoice PO modal.
 */
class OrderInvoicePoModal extends Bootstrap2Modal {

  static LOCATORS = {
    loading:      '.loader-container',
    updateButton: '#finished-invoice-po-btn',
    cancelButton: '#none-invoice-po-btn',
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
    await this.root.locator(OrderInvoicePoModal.LOCATORS.loading)
      .waitFor({ state: 'hidden', timeout: 60000 });
  }

  /**
   * Clicks the Update button to submit the modal.
   */
  async submit() {
    await this.root.locator(OrderInvoicePoModal.LOCATORS.updateButton).click();
  }
}

module.exports = { OrderInvoicePoModal };
