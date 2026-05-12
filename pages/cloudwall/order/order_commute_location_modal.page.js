const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Order Commute Location modal.
 */
class OrderCommuteLocationModal extends Bootstrap2Modal {

  static LOCATORS = {
    updateButton:              '#update-commute-btn',
    commuteLocationSelect:     '#select-commute-address',
    cancelButton:              '#cancel-commute-edit',
    streetAddress:             '[name="address1"]',
    city:                      '[name="city"]',
    state:                     '#commute-state',
    zip:                       '#commute-postal-code',
    commuteTransportType:      '#commuteTransportationTypeList',
    commuteFourDayButton:      '#commute-day-4',
    commuteThreeDayButton:     '#commute-day-3',
    talentHomeAddressSelect:   '#select-commute-address option[value="2"]',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Waits for the modal to finish loading.
   */
  async waitForLoad() {
    await this.root.locator(OrderCommuteLocationModal.LOCATORS.commuteLocationSelect)
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Clicks the Cancel button.
   */
  async clickCancel() {
    await this.root.locator(OrderCommuteLocationModal.LOCATORS.cancelButton).click();
  }

  /**
   * Selects a commute location type from the dropdown.
   *
   * @param {string} type
   */
  async selectLocationType(type) {
    const select = this.root.locator(OrderCommuteLocationModal.LOCATORS.commuteLocationSelect);
    await select.selectOption(type);
    await select.waitFor({ state: 'attached' });
  }

  /**
   * Selects a transportation type from the dropdown.
   *
   * @param {string} type
   */
  async selectTransportationType(type) {
    const select = this.root.locator(OrderCommuteLocationModal.LOCATORS.commuteTransportType);
    await select.selectOption(type);
    await select.waitFor({ state: 'attached' });
  }

  /**
   * Fills in all address fields from an address object.
   *
   * @param {Object} address
   * @param {string} address.street
   * @param {string} address.city
   * @param {string} address.state
   * @param {string} address.zip
   */
  async fillAddress(address) {
    await this.setCommuteLocationStreet(address.street);
    await this.setCommuteLocationCity(address.city);
    await this.setCommuteLocationState(address.state);
    await this.setCommuteLocationZip(address.zip);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationStreet(text) {
    const field = this.root.locator(OrderCommuteLocationModal.LOCATORS.streetAddress);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationCity(text) {
    const field = this.root.locator(OrderCommuteLocationModal.LOCATORS.city);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationState(text) {
    const field = this.root.locator(OrderCommuteLocationModal.LOCATORS.state);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationZip(text) {
    const field = this.root.locator(OrderCommuteLocationModal.LOCATORS.zip);
    await field.clear();
    await field.fill(text);
  }

  /**
   * Toggles commute days between 3 and 4. If the 4-day button is active,
   * clicks the 3-day button and returns '3'; otherwise clicks 4-day and returns '4'.
   *
   * @returns {Promise<string>} '3' or '4'
   */
  async selectCommuteDays() {
    const fourDayButton = this.root.locator(OrderCommuteLocationModal.LOCATORS.commuteFourDayButton);
    const classes = await fourDayButton.getAttribute('class');

    if (classes.includes('active')) {
      await this.root.locator(OrderCommuteLocationModal.LOCATORS.commuteThreeDayButton).click();
      return '3';
    } else {
      await fourDayButton.click();
      return '4';
    }
  }
}

module.exports = { OrderCommuteLocationModal };
