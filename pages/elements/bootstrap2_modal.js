/**
 * Base class for Bootstrap 2 modals in CloudWall.
 *
 * Migrated from the Ruby Bootstrap2Modal element class.
 * Provides common modal operations (submit, cancel, close, visibility checks).
 *
 * Subclasses (GatherCandidatesModal, FillOrder, DuplicateOrderDialog, etc.)
 * receive a Playwright Locator pointing at the modal root element.
 */
class Bootstrap2Modal {
  /**
   * @param {import('@playwright/test').Locator} rootLocator - Locator for the modal root element
   */
  constructor(rootLocator) {
    this.root = rootLocator;
  }

  /**
   * Checks whether the modal is currently visible.
   *
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isDisplayed(timeout = 5000) {
    return this.root.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Waits for the modal to become visible.
   *
   * @param {number} [timeout=10000]
   */
  async waitForVisible(timeout = 10000) {
    await this.root.waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for the modal to disappear.
   *
   * @param {number} [timeout=10000]
   */
  async waitForHidden(timeout = 10000) {
    await this.root.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Clicks the modal's submit / primary action button.
   * Looks for common Bootstrap 2 submit button patterns.
   */
  async submit() {
    const submitBtn = this.root.locator(
      'button.btn-primary, input[type="submit"], button[type="submit"], .modal-footer .btn-primary'
    );
    await submitBtn.first().click();
  }

  /**
   * Clicks the modal's cancel button.
   */
  async cancel() {
    const cancelBtn = this.root.locator(
      'button.btn-cancel, button:has-text("Cancel"), .modal-footer .btn-default, a.close'
    );
    await cancelBtn.first().click();
  }

  /**
   * Closes the modal via the X button.
   */
  async close() {
    const closeBtn = this.root.locator('button.close, .modal-header button.close, [data-dismiss="modal"]');
    await closeBtn.first().click();
  }

  /**
   * Finds a locator within the modal root.
   *
   * @param {string} selector
   * @returns {import('@playwright/test').Locator}
   */
  locator(selector) {
    return this.root.locator(selector);
  }
}

module.exports = { Bootstrap2Modal };
