const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Make Candidate Search screen.
 */
class MakeCandidateSearch extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawTalentMakeCandidate';

  static LOCATORS = {
    orderId:              '[name="orderID"]',
    searchOnlyMyOrders:   '[name="isOnlyMyOrders"]',
    runSearchButton:      '#link_runSearch',
    recordLabel:          '.RecordLabel',
  };

  static PROC_MAPPINGS = [
    'AWUIDrawTalentMakeCandidate',
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
   * Gets the record label text.
   *
   * @returns {Promise<string>}
   */
  async getRecordLabel() {
    return this.page.locator(MakeCandidateSearch.LOCATORS.recordLabel).textContent();
  }
}

module.exports = { MakeCandidateSearch };
