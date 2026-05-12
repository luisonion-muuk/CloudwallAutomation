const { ActionScreen } = require('../action_screen');

/**
 * Page class supporting operations related to the Order Set Persons Responsible screen.
 */
class OrderSetPersonsResponsibleActionScreen extends ActionScreen {

  static PATH = /\/order\/set-persons-responsible/;

  static LOCATORS = {
    submitButton:           '#submitButton',
    cancelButton:           '#link_cancel',
    orderDetail:            '#orderDetail',
    manageCandidates:       '#manageCandidates',
    fees:                   '#fees',
    processCandidateQueue:  '#processCandidateQueue',
    createActivity:         '#createActivity',
    fieldAccountManager:    '#s2id_accountManagerSelect',
    fieldSalesManager:      '#s2id_salesManagerSelect',
    fieldFulfillmentManager:'#s2id_fulfillmentManagerSelect',
    fieldAssistedBy:        '#s2id_orderAssistedBySelect',
  };

  static FIELDS = {
    accountManager:      { type: 'select2' },
    salesManager:        { type: 'select2' },
    fulfillmentManager:  { type: 'select2' },
    recruiter:           { type: 'select2' },
    assistedBy:          { type: 'select2' },
  };

  static PATH_MAPPINGS = [
    /\/order\/set-persons-responsible/,
  ];

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  /**
   * Gets the currently selected text from a select element.
   *
   * @param {string} locatorKey - Key from LOCATORS
   * @returns {Promise<string>}
   */
  async getSelectValue(locatorKey) {
    const select = this.page.locator(OrderSetPersonsResponsibleActionScreen.LOCATORS[locatorKey]);
    const selectedValue = await select.inputValue();
    return select.locator(`option[value="${selectedValue}"]`).textContent();
  }
}

module.exports = { OrderSetPersonsResponsibleActionScreen };
