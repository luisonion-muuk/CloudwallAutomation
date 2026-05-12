const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class that supports operations related to the Submit Duplicate Order screen.
 */
class OrderSubmitDuplicate extends LegacyActionScreen {

  static PROC_NAME = 'AWUISubmitDuplicateOrder';

  static LOCATORS = {
    fillPendingOnboarding: '#link_provisionalDuplicateOrder',
    prefill:               '#link_duplicatePreFill',
    validation:            '[pageid="MissingInfo"]',
    resolve:               '[name="click-to-resolve"]',

    // Custom questions
    cqUnansweredLabel:     '//td[contains(@class, "FieldContent") and contains(@class, "errorLabel") and contains(text(), "There are ") and contains(text(), " unanswered onboarding questions.")]',
    cqQuestion1:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[1]',
    cqAnswer1Select:       '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[2]/td/select',
    cqAnswer1Input:        '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[2]/td/input',
    cqQuestion2:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[3]',
    cqAnswer2Select:       '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[4]/td/select',
    cqAnswer2Input:        '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[4]/td/input',
    cqQuestion3:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[5]',
    cqAnswer3Select:       '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[6]/td/select',
    cqAnswer3Input:        '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[6]/td/input',
    cqQuestion4:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[7]',
    cqAnswer4Select:       '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[8]/td/select',
    cqAnswer4Input:        '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[8]/td/input',
  };

  static PROC_MAPPINGS = [
    'AWUISubmitDuplicateOrder',
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
   * Clicks the "Fill Pending Onboarding" ASABA button and dismisses any alert.
   * Returns true if no alert was encountered, false otherwise.
   *
   * @returns {Promise<boolean>}
   */
  async submitFillPendingOnboarding() {
    let alertText = null;
    this.page.once('dialog', (dialog) => {
      alertText = dialog.message();
      dialog.dismiss();
    });
    await this.clickAsaba('provisionalDuplicateOrder');
    await this.page.waitForTimeout(500);
    if (alertText) {
      console.error(`Error encountered while attempting to fill pending onboarding: ${alertText}`);
    }
    return !alertText;
  }
}

module.exports = { OrderSubmitDuplicate };
