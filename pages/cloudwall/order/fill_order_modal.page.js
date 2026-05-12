const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');
const { Select2 } = require('../../elements/select2_element');

/**
 * Page class supporting operations related to the Fill Order modal.
 */
class FillOrder extends Bootstrap2Modal {

  static LOCATORS = {
    readyTalentSelect:              '#s2id_ready-talent',
    workLocationType:               '#select-address',
    workLocationAddress:            '#work-address-display',
    otherWorkLocationStreet:        '#add-other-work-address > div:nth-child(4) > div > div > input',
    otherWorkLocationCity:          '#add-other-work-address > div:nth-child(7) > div > div > input:nth-child(1)',
    otherWorkLocationPostalCode:    '#work-addr-postal-code',
    otherWorkLocationAddrState:     '#work-addr-state',
    taxArea:                        '#select-tax-area',
    workLocationUpdateReason:       '#update-reason',
    cancelButton:                   '#fill-order-close-btn',
    fillOrderButton:                '#fill-order-btn',
    workLocationChangeDate:         '#datepicker',
    commuteLocationSelect:          '#commute-address-select',
    commuteDayOne:                  '#modal-commute-day-1',
    commuteDayTwo:                  '#modal-commute-day-2',
    commuteDayThree:                '#modal-commute-day-3',
    commuteDayFour:                 '#modal-commute-day-4',
    commuteDayFive:                 '#modal-commute-day-5',
    commuteDaySix:                  '#modal-commute-day-6',
    commuteTransportationType:      '#commuteTransportationType',
    otherCommuteLocationStreet:     '[name="commute-address1"]',
    otherCommuteLocationCity:       '[name="commute-city"]',
    otherCommuteLocationPostalCode: '[name="commute-postalCode"]',
    otherCommuteLocationAddrState:  '#commute-state',
  };

  static COMMUTE_DAY_LOCATORS = {
    one:   '#modal-commute-day-1',
    two:   '#modal-commute-day-2',
    three: '#modal-commute-day-3',
    four:  '#modal-commute-day-4',
    five:  '#modal-commute-day-5',
    six:   '#modal-commute-day-6',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
    this.talentSelect = new Select2(this.root.locator(FillOrder.LOCATORS.readyTalentSelect));
  }

  // --- Talent ---

  /**
   * Gets the currently selected talent ID.
   *
   * @returns {Promise<string>}
   */
  async getTalentId() {
    return this.talentSelect.getValue();
  }

  /**
   * Searches for and selects a talent by ID.
   *
   * @param {string} talentId
   */
  async setTalentId(talentId) {
    await this.talentSelect.setSearchText(talentId);
    await this.talentSelect.selectResultByNumber(1);
  }

  // --- Work Location Type ---

  /**
   * Sets the work location type dropdown.
   *
   * @param {string} type - A key from WORK_LOCATION_TYPES
   */
  async setWorkLocationType(type) {
    const select = this.root.locator(FillOrder.LOCATORS.workLocationType);
    await select.selectOption(type);
    await select.waitFor({ state: 'attached' });
  }

  /**
   * Gets the displayed work location address text.
   *
   * @returns {Promise<string>}
   */
  async getWorkLocationAddress() {
    return this.root.locator(FillOrder.LOCATORS.workLocationAddress).textContent();
  }

  // --- Work Location Fields ---

  /**
   * @param {string} text
   */
  async setWorkLocationStreet(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherWorkLocationStreet);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setWorkLocationCity(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherWorkLocationCity);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setWorkLocationPostalCode(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherWorkLocationPostalCode);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setWorkLocationState(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherWorkLocationAddrState);
    await field.clear();
    await field.fill(text);
  }

  // --- Commute Location Type ---

  /**
   * Sets the commute location type dropdown.
   *
   * @param {string} type - A key from COMMUTE_LOCATION_TYPES
   */
  async setCommuteLocationType(type) {
    const select = this.root.locator(FillOrder.LOCATORS.commuteLocationSelect);
    await select.selectOption(type);
    await select.waitFor({ state: 'attached' });
  }

  // --- Commute Days ---

  /**
   * Selects a commute day button if it is not already active.
   *
   * @param {string} day - A key from COMMUTE_DAY_LOCATORS (e.g. 'one', 'two', etc.)
   */
  async selectCommuteDay(day) {
    const button = this.root.locator(FillOrder.COMMUTE_DAY_LOCATORS[day]);
    const classes = await button.getAttribute('class');
    if (!classes.includes('active')) {
      await button.click();
    }
  }

  // --- Commute Transportation Type ---

  /**
   * Sets the commute transportation type dropdown.
   *
   * @param {string} type - A key from COMMUTE_TRANSPORTATION_TYPES
   */
  async setTransportationType(type) {
    const select = this.root.locator(FillOrder.LOCATORS.commuteTransportationType);
    await select.selectOption(type);
    await select.waitFor({ state: 'attached' });
  }

  // --- Commute Location Fields ---

  /**
   * @param {string} text
   */
  async setCommuteLocationStreet(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherCommuteLocationStreet);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationCity(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherCommuteLocationCity);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationPostalCode(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherCommuteLocationPostalCode);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setCommuteLocationState(text) {
    const field = this.root.locator(FillOrder.LOCATORS.otherCommuteLocationAddrState);
    await field.clear();
    await field.fill(text);
  }

  // --- Tax Area ---

  /**
   * Gets all available tax area option texts.
   *
   * @returns {Promise<string[]>}
   */
  async getTaxAreas() {
    const options = this.root.locator(`${FillOrder.LOCATORS.taxArea} option`);
    const count = await options.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push(await options.nth(i).textContent());
    }
    return texts;
  }

  /**
   * Sets the tax area dropdown by value.
   *
   * @param {string} area - A key from TAX_AREA_IDS
   */
  async setTaxArea(area) {
    await this.root.locator(FillOrder.LOCATORS.taxArea).selectOption(area);
  }

  /**
   * Selects the last option in the tax area dropdown.
   */
  async taxAreaSelectLastOption() {
    const options = this.root.locator(`${FillOrder.LOCATORS.taxArea} option`);
    const count = await options.count();
    const lastValue = await options.nth(count - 1).getAttribute('value');
    await this.root.locator(FillOrder.LOCATORS.taxArea).selectOption(lastValue);
  }

  // --- Work Location Update ---

  /**
   * @param {string} comment
   */
  async setWorkLocationUpdateReason(comment) {
    const field = this.root.locator(FillOrder.LOCATORS.workLocationUpdateReason);
    await field.clear();
    await field.fill(comment);
  }

  /**
   * @param {string} changeDate
   */
  async setWorkLocationChangeDate(changeDate) {
    const field = this.root.locator(FillOrder.LOCATORS.workLocationChangeDate);
    await field.clear();
    await field.fill(changeDate);
  }

  // --- Actions ---

  /**
   * Clicks the Fill Order / Submit button.
   */
  async submitWorkLocationChange() {
    await this.root.locator(FillOrder.LOCATORS.fillOrderButton).click();
  }

  /**
   * Clicks the Cancel button.
   */
  async clickCancelButton() {
    await this.root.locator(FillOrder.LOCATORS.cancelButton).click();
  }
}

module.exports = { FillOrder };
