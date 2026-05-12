const { ActionScreen } = require('../action_screen');

/**
 * Page class supporting operations related to the Talent Pool Edit screen.
 */
class TalentPoolEditActionScreen extends ActionScreen {

  static PATH = /\/pools\/[0-9]+\/edit/;
  static OPEN_PATH = '/pools/%d/edit';

  static SELECTORS = {
    collaboratorValue: (id) => `.selectize-dropdown-content > div[data-value="${id}"]`,
  };

  static LOCATORS = {
    submitButton:              '#submitButton',
    cancelButton:              '#link_cancel',
    manageCandidates:          '#manageCandidates',
    newPosting:                '#newPosting',
    viewPosting:               '#viewPosting',
    fieldPoolName:             '#poolName',
    fieldJobDescription:       '#jobDescription',
    fieldInternalOrderInfo:    '#internalOrderInfo',
    fieldAccountManager:       '#accountManagerSelect',
    fieldAccountManagerSelected: '#accountManagerSelect option[selected="selected"]',
    fieldSegment:              '#segmentSelect',
    fieldPlacementType:        '#placementTypeSelect',
    fieldOrderedBy:            '#orderedBySelect',
    fieldSalesManager:         '#salesManagerSelect',
    fieldDivision:             '#divisionSelect',
    fieldAssistedBy:           '#orderAssistedBySelect',
    fieldOrderStatus:          '#statusSelect',
    fieldCollaboratorsInput:   '#collaborators-select-selectized',
  };

  static FIELDS = {
    poolName:          { type: 'text' },
    jobDescription:    { type: 'text' },
    internalOrderInfo: { type: 'text' },
    segment:           { type: 'select' },
    placementType:     { type: 'select' },
    accountManager:    { type: 'select' },
    orderedBy:         { type: 'select' },
    salesManager:      { type: 'select' },
    division:          { type: 'select' },
    assistedBy:        { type: 'select' },
    orderStatus:       { type: 'select' },
  };

  static PATH_MAPPINGS = [
    /\/pools\/[0-9]+\/edit/,
    /\/pools\/[0-9]+\/new/,
    '/pools/duplicate',
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
    const select = this.page.locator(TalentPoolEditActionScreen.LOCATORS[locatorKey]);
    const selectedValue = await select.inputValue();
    return select.locator(`option[value="${selectedValue}"]`).textContent();
  }

  /**
   * Types a collaborator name and selects from the dropdown.
   *
   * @param {string} name
   * @param {string|number} id
   */
  async addCollaborator(name, id) {
    const input = this.page.locator(TalentPoolEditActionScreen.LOCATORS.fieldCollaboratorsInput);
    await input.clear();
    await input.fill(name);
    const option = this.page.locator(TalentPoolEditActionScreen.SELECTORS.collaboratorValue(String(id)));
    await option.waitFor({ state: 'visible' });
    await option.click();
  }
}

module.exports = { TalentPoolEditActionScreen };
