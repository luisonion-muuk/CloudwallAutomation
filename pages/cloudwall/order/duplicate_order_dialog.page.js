const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the "Duplicate Order" dialog accessed via
 * the "Duplicate" ASABA on the order view detail page.
 *
 * @see OrderViewDetail
 */
class DuplicateOrderDialog extends Bootstrap2Modal {

  static LOCATORS = {
    selectWhy: '#select-why',

    // Fill with same talent
    fillWithSameTalentGroup:      '#fill-order-group',
    fillWithSameTalentYes:        '#fill-order-group div.controls input[name="fill-order"][value="true"]',
    fillWithSameTalentNo:         '#fill-order-group div.controls input[name="fill-order"][value="false"]',
    fillWithSameTalentNonRtwWarn: '//div[@id="talent-fill"]/div[contains(text(), "non RTW talent")]',

    // Keep custom field values
    keepCustomFieldGroup:    '#custom-field-group',
    keepCustomFieldYes:      '#custom-field-group div.controls input[name="custom-fields"][value="true"]',
    keepCustomFieldNo:       '#custom-field-group div.controls input[name="custom-fields"][value="false"]',

    // Copy talent to new order
    copyTalentGroup:    '#copy-talent-group',
    copyTalentYes:      '#copy-talent-group div.controls input[name="copy-talent"][value="true"]',
    copyTalentNo:       '#copy-talent-group div.controls input[name="copy-talent"][value="false"]',

    // Duplicate as
    duplicateAsGroup:       '#duplicate-as-group',
    duplicateAsTalentPool:  '#duplicate-as-group div.controls input[name="duplicate-as"][value="talentPool"]',
    duplicateAsOrder:       '#duplicate-as-group div.controls input[name="duplicate-as"][value="order"]',
  };

  static DUPLICATE_REASONS = {
    netNewPosition:       1,
    administrativeChange: 2,
    talentChange:         3,
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  // --- Duplicate Reason ---

  /**
   * Gets the currently selected duplicate reason key.
   *
   * @returns {Promise<string|undefined>} The key from DUPLICATE_REASONS matching the current value
   */
  async getDuplicateReason() {
    const value = Number(await this.root.locator(DuplicateOrderDialog.LOCATORS.selectWhy).inputValue());
    return Object.keys(DuplicateOrderDialog.DUPLICATE_REASONS)
      .find(key => DuplicateOrderDialog.DUPLICATE_REASONS[key] === value);
  }

  /**
   * Sets the duplicate reason dropdown.
   *
   * @param {string} reason - A key from DUPLICATE_REASONS (e.g. 'netNewPosition')
   */
  async setDuplicateReason(reason) {
    const value = String(DuplicateOrderDialog.DUPLICATE_REASONS[reason]);
    await this.root.locator(DuplicateOrderDialog.LOCATORS.selectWhy).selectOption({ value });
  }

  // --- Fill with same talent ---

  /**
   * Returns whether "Fill with same talent" is set to Yes.
   *
   * @returns {Promise<boolean>}
   */
  async getFillWithSameTalent() {
    return this.root.locator(DuplicateOrderDialog.LOCATORS.fillWithSameTalentYes).isChecked();
  }

  /**
   * Sets the "Fill with same talent" radio option.
   *
   * @param {boolean} val - true for Yes, false for No
   */
  async setFillWithSameTalent(val) {
    const group = this.root.locator(DuplicateOrderDialog.LOCATORS.fillWithSameTalentGroup);
    if (await group.count() > 0) {
      const locator = val
        ? DuplicateOrderDialog.LOCATORS.fillWithSameTalentYes
        : DuplicateOrderDialog.LOCATORS.fillWithSameTalentNo;
      await this.root.locator(locator).click();
    }
  }

  // --- Keep custom field values ---

  /**
   * Returns whether "Keep custom field values" is set to Yes.
   *
   * @returns {Promise<boolean>}
   */
  async getKeepCustomFieldValues() {
    return this.root.locator(DuplicateOrderDialog.LOCATORS.keepCustomFieldYes).isChecked();
  }

  /**
   * Sets the "Keep custom field values" radio option.
   *
   * @param {boolean} val - true for Yes, false for No
   */
  async setKeepCustomFieldValues(val) {
    const group = this.root.locator(DuplicateOrderDialog.LOCATORS.keepCustomFieldGroup);
    if (await group.isVisible()) {
      const locator = val
        ? DuplicateOrderDialog.LOCATORS.keepCustomFieldYes
        : DuplicateOrderDialog.LOCATORS.keepCustomFieldNo;
      await this.root.locator(locator).click();
    }
  }

  // --- Copy talent to new order ---

  /**
   * Returns whether "Copy talent to new order" is set to Yes.
   *
   * @returns {Promise<boolean>}
   */
  async getCopyTalentToNewOrder() {
    return this.root.locator(DuplicateOrderDialog.LOCATORS.copyTalentYes).isChecked();
  }

  /**
   * Sets the "Copy talent to new order" radio option.
   *
   * @param {boolean} val - true for Yes, false for No
   */
  async setCopyTalentToNewOrder(val) {
    const group = this.root.locator(DuplicateOrderDialog.LOCATORS.copyTalentGroup);
    if (await group.count() > 0) {
      const locator = val
        ? DuplicateOrderDialog.LOCATORS.copyTalentYes
        : DuplicateOrderDialog.LOCATORS.copyTalentNo;
      await this.root.locator(locator).click();
    }
  }

  // --- Duplicate as ---

  /**
   * Clicks the "Talent Pool" radio button under "Duplicate as".
   */
  async duplicateAsTalentPool() {
    await this.root.locator(DuplicateOrderDialog.LOCATORS.duplicateAsTalentPool).click();
  }

  /**
   * Clicks the "Order" radio button under "Duplicate as".
   */
  async duplicateAsOrder() {
    await this.root.locator(DuplicateOrderDialog.LOCATORS.duplicateAsOrder).click();
  }

  /**
   * Sets the "Duplicate as" radio option.
   *
   * @param {boolean} val - true for Order, false for Talent Pool
   */
  async setDuplicateAsOrder(val) {
    const group = this.root.locator(DuplicateOrderDialog.LOCATORS.duplicateAsGroup);
    if (await group.count() > 0) {
      const locator = val
        ? DuplicateOrderDialog.LOCATORS.duplicateAsOrder
        : DuplicateOrderDialog.LOCATORS.duplicateAsTalentPool;
      await this.root.locator(locator).click();
    }
  }
}

module.exports = { DuplicateOrderDialog };
