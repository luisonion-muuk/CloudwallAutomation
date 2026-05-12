const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Fee List screen.
 */
class FeeList extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawFeeList';

  static TAB_IDS = {
    orderFees: 'CurrentFees',
  };

  static PROC_MAPPINGS = [
    'AWUIDrawFeeList',
  ];

  /**
   * @param {import('@playwright/test').Locator} elem - The screen root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Clicks the New Fee ASABA button.
   */
  async clickNewFee() {
    await this.clickAsaba('newFee');
  }

  /**
   * Clicks the View/Edit Fee ASABA button.
   */
  async clickViewEditFee() {
    await this.clickAsaba('viewEditFee');
  }

  /**
   * Clicks the Delete Fee ASABA button.
   */
  async clickDeleteFee() {
    await this.clickAsaba('deleteFee');
  }
}

module.exports = { FeeList };
