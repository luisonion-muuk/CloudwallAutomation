const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class that acts as the verification screen after attempting to fill an order
 * with missing info or pending on-boarding.
 */
class OrderMissingInfo extends LegacyActionScreen {

  static PROC_NAME = 'AWUISubmitQuickFill';

  static LOCATORS = {
    fillPendingOnboarding:    '#link_provisionalQuickFill',
    recordLabel:              '.RecordLabel',
    cannotFillOrderText:      '#CannotFillOrderHeadingText',
    orderErrors:              '#order-errors',
    resubmit:                 '#resubmitQuickFillButton',
    fillOrder:                '//div[contains(text(),"Fill Order")]',
    fillOrderBtn:             '#link_resubmitQuickFill',
    errorRow:                 '#order-errors tr',
    errorRowLabel:            '.errorLabel',
    errorRowClickToResolve:   '//a[@name="click-to-resolve"]',
    onboarderNotesClickToResolve: '//*[@id="order-errors"]/tbody/tr[5]/td/a',
    customFieldSelect:        'select[id^="custom_field"]',
    customFieldValue:         '.custom-field-value',
    rateIsCorrect:            '//a[text()="Rate is Correct"]',

    // Custom questions
    cqUnansweredLabel:        '//td[contains(@class, "FieldContent") and contains(@class, "errorLabel") and contains(text(), "There are ") and contains(text(), " unanswered onboarding questions.")]',
    cqQuestion1:              '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[1]',
    cqAnswer1Select:          '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[2]/td/select',
    cqAnswer1Input:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[2]/td/input',
    cqQuestion2:              '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[3]',
    cqAnswer2Select:          '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[4]/td/select',
    cqAnswer2Input:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[4]/td/input',
    cqQuestion3:              '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[5]',
    cqAnswer3Select:          '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[6]/td/select',
    cqAnswer3Input:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[6]/td/input',
    cqQuestion4:              '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[7]',
    cqAnswer4Select:          '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[8]/td/select',
    cqAnswer4Input:           '//*[@pageid="MissingInfo"]/table[3]/tbody/tr[8]/td/input',
  };

  static PROC_MAPPINGS = [
    'AWUISubmitQuickFill',
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
    await this.clickAsaba('provisionalQuickFill');
    await this.page.waitForTimeout(500);
    if (alertText) {
      console.error(`Error encountered while attempting to fill pending onboarding: ${alertText}`);
    }
    return !alertText;
  }

  /**
   * Fills in custom onboarding questions (1–4) using select or text input,
   * then optionally clicks resubmit.
   *
   * @param {boolean} [clickResubmit=true]
   * @param {string|null} [text=null] - Text to use for input fields; defaults to a timestamp
   */
  async fillCustomQuestions(clickResubmit = true, text = null) {
    text = text || String(Date.now());

    for (let i = 1; i <= 4; i++) {
      const selectLocator = this.page.locator(OrderMissingInfo.LOCATORS[`cqAnswer${i}Select`]);
      const inputLocator = this.page.locator(OrderMissingInfo.LOCATORS[`cqAnswer${i}Input`]);

      if (await selectLocator.count() > 0) {
        // Select the second option (index 1)
        const options = selectLocator.locator('option');
        const count = await options.count();
        if (count > 1) {
          const value = await options.nth(1).getAttribute('value');
          await selectLocator.selectOption(value);
        }
      } else if (await inputLocator.count() > 0) {
        await inputLocator.fill(text);
      }
    }

    if (clickResubmit) {
      await this.resubmit();
    }
  }

  /**
   * Finds an error row by label text and clicks its "click to resolve" link.
   *
   * @param {string} errorText
   */
  async clickToResolve(errorText) {
    const rows = this.page.locator(OrderMissingInfo.LOCATORS.errorRow);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const label = row.locator(OrderMissingInfo.LOCATORS.errorRowLabel);

      if (await label.count() === 0) continue;

      const labelText = (await label.textContent()).trim();
      if (labelText.toLowerCase() === errorText.toLowerCase()) {
        await row.locator(OrderMissingInfo.LOCATORS.errorRowClickToResolve).click();
        break;
      }
    }
  }

  /**
   * Clicks the Resubmit button.
   */
  async resubmit() {
    await this.page.locator(OrderMissingInfo.LOCATORS.resubmit).click();
  }

  /**
   * Gets the order ID from the record label's data attribute.
   *
   * @returns {Promise<string>}
   */
  async getOrderId() {
    return this.page.locator(OrderMissingInfo.LOCATORS.recordLabel).getAttribute('data-record-id');
  }

  /**
   * Finds the first custom field select element and selects the given value.
   *
   * @param {string} value
   */
  async answerCustomFieldQuestion(value) {
    await this.page.locator(OrderMissingInfo.LOCATORS.customFieldSelect)
      .first()
      .selectOption(value);
  }
}

module.exports = { OrderMissingInfo };
