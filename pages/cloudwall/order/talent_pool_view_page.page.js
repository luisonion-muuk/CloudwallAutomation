const { ActionScreen } = require('../action_screen');
const { DuplicateOrderDialog } = require('./duplicate_order_dialog');

/**
 * Page class supporting operations related to the Talent Pool View screen.
 */
class TalentPoolViewActionScreen extends ActionScreen {

  static PATH = /\/pools\/[0-9]+\/view/;
  static OPEN_PATH = '/pools/%d/view';

  static TAB_IDS = {
    summary:         'summary',
    activityHistory: 'activity-history',
  };

  static LOCATORS = {
    firstRecord:         '#firstRecord',
    previousRecord:      '#previousRecord',
    nextRecord:          '#nextRecord',
    lastRecord:          '#lastRecord',
    recordNavTracker:    '#recordNavTracker b:first-child',
    poolHeadline:        '#poolHeadline',
    talentPoolDetails:   '#poolDetails',
    manageCandidates:    '#manageCandidates',
    createActivity:      '#createActivity',
    poolName:            '#poolName',
    sourcePoolId:        '#sourcePoolId',
    clientName:          '#clientName',
    division:            '#division',
    internalOrderInfo:   '#internalOrderInfo',
    segment:             '#segment',
    placementType:       '#placementType',
    jobDescription:      '#jobDescription',
    orderedByName:       '#orderedByName',
    orderedByLink:       '#orderedByLink',
    accountManager:      '#clientServices',
    salesManager:        '#salesManager',
    orderedByPhone:      '#orderedByPhone',
    orderedByEmail:      '#orderedByEmail',
    collaborators:       '.collaborators',
    edit:                '#editButton',
    duplicatePool:       '#duplicatePool',
    duplicateOrderModal: '#duplicate-order-modal',
    newPosting:          '#newPosting',
    viewPosting:         '#viewPosting',
    assistedBy:          '#orderAssistedBy',
  };

  static PATH_MAPPINGS = [
    /\/pools\/[0-9]+\/view/,
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
   * Opens the duplicate pool dialog.
   *
   * @returns {DuplicateOrderDialog}
   */
  async openDuplicatePool() {
    await this.page.locator(TalentPoolViewActionScreen.LOCATORS.duplicatePool).click();
    return new DuplicateOrderDialog(this.page.locator(TalentPoolViewActionScreen.LOCATORS.duplicateOrderModal));
  }

  /**
   * Duplicates the talent pool with the given configuration.
   *
   * @param {Object} data
   * @param {string} data.whyDupe - Duplicate reason key
   * @param {boolean} [data.fillSameTalent] - Fill with same talent (omit to skip)
   * @param {boolean} data.copyTalent - Copy talent to new order
   * @param {boolean} data.orderDupe - Duplicate as order (true) or talent pool (false)
   */
  async duplicateTalentPool(data) {
    await this.page.locator(TalentPoolViewActionScreen.LOCATORS.duplicatePool).click();
    const modal = new DuplicateOrderDialog(
      this.page.locator(TalentPoolViewActionScreen.LOCATORS.duplicateOrderModal)
    );
    await modal.setDuplicateReason(data.whyDupe);
    if (data.fillSameTalent != null) {
      await modal.setFillWithSameTalent(data.fillSameTalent);
    }
    await modal.setCopyTalentToNewOrder(data.copyTalent);
    await modal.setDuplicateAsOrder(data.orderDupe);
    await modal.submit();
  }
}

module.exports = { TalentPoolViewActionScreen };
