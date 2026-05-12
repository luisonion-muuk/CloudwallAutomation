const { OrderDrawNewOrderFromClient } = require('./order_draw_new_order_from_client');

/**
 * Page class supporting operations related to the Submit New Order / Job Posting screen.
 */
class SubmitNewOrder extends OrderDrawNewOrderFromClient {

  static PROC_NAME = 'AWUISubmitNewOrder';

  static TAB_IDS = {
    general:                'general',
    postingContent:         'languageSpecific',
    preInterviewQuestions:  'preInterviewQuestions',
  };

  static SELECTORS = {
    agentOption: (id) => `div.content div[val="${id}"]`,
  };

  static LOCATORS = {
    recordLabel:              '.RecordLabel',
    pdPositionTitle:          '[name="title"]',
    resultFrame:              'iframe[id*="ClientsFrame"]',
    recordNav:                '#RecordNavBar',
    agentResponsible:         '#postedBy_input',
    market:                   '#marketId',
    offSitePreference:        '#offSitePreferenceId',
    jobLocation:              '#jobLoc',
    placementType:            '#placementType',
    postalCode:               '[name="postalCode"]',
    shareClient:              '[name="shareClientName"]',
    clientName:               '[name="clientName"]',
    jobTitle:                 '[name="localizedDescription[0].jobTitle"]',
    jobLocationPosting:       '[name="localizedDescription[0].cityNeighborhood"]',
    paySalaryRate:            '#salaryPayRateInput',
    jobDescription:           'iframe[title*="jobDescription"]',
    payTalentOvertimeYes:     '#payTalentOvertimeYesClick',
    payTalentOvertimeNo:      '#payTalentOvertimeNoClick',
    billClientOvertimeYes:    '#billClientForOvertimeYesClick',
    billClientOvertimeNo:     '#billClientForOvertimeNoClick',
    fiExclusive:              '#exclusiveOrderStatus',
    fiDirect:                 '#directOrderStatus',
    fieldExclusive:           '#exclusiveOrderStatus',
    fieldDirect:              '#directOrderStatus',
  };

  static FIELDS = {
    exclusive: { tab: 'financialInfo', type: 'select' },
    direct:    { tab: 'financialInfo', type: 'select' },
  };

  static PROC_MAPPINGS = [
    'AWUISubmitNewOrder',
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
   * Selects the agent responsible by typing a name and clicking the matching option.
   *
   * @param {string} agentName
   * @param {string|number} agentId
   */
  async selectAgentResponsible(agentName, agentId) {
    const field = this.page.locator(SubmitNewOrder.LOCATORS.agentResponsible);
    await field.clear();
    await field.fill(String(agentName));
    await this.page.locator(SubmitNewOrder.SELECTORS.agentOption(agentId)).click();
  }

  /**
   * Clicks Save and dismisses any alert. Returns true if no alert was encountered.
   *
   * @returns {Promise<boolean>}
   */
  async save() {
    let alertText = null;
    this.page.once('dialog', (dialog) => {
      alertText = dialog.message();
      dialog.dismiss();
    });
    await this.clickAsaba('Save');
    await this.page.waitForTimeout(500);
    if (alertText) {
      console.error(`Alert encountered while attempting to save: ${alertText}`);
    }
    return !alertText;
  }

  /**
   * Clicks Save & Post and dismisses any alert. Returns true if no alert was encountered.
   *
   * @returns {Promise<boolean>}
   */
  async savePost() {
    let alertText = null;
    this.page.once('dialog', (dialog) => {
      alertText = dialog.message();
      dialog.dismiss();
    });
    await this.clickAsaba('save_post');
    await this.page.waitForTimeout(500);
    if (alertText) {
      console.error(`Alert encountered while attempting to save and post: ${alertText}`);
    }
    return !alertText;
  }

  /**
   * Clicks the Cancel button.
   */
  async cancel() {
    await this.clickAsaba('Cancel');
  }

  /**
   * Gets the order ID from the record label text.
   *
   * @returns {Promise<string>}
   */
  async getOrderId() {
    const text = await this.page.locator('div.RecordLabel').textContent();
    const match = text.match(/New Posting for .* \(Order ID (\d+)\)/);
    return match ? match[1] : '';
  }

  /**
   * Fills in the minimum required fields to create a new posting.
   */
  async newPostingAutoFill() {
    // Select first job location option
    const jobLocationSelect = this.page.locator(SubmitNewOrder.LOCATORS.jobLocation);
    const firstOption = jobLocationSelect.locator('option:not([value=""])').first();
    const value = await firstOption.getAttribute('value');
    await jobLocationSelect.selectOption(value);

    // Add Test Automation as Agent Responsible
    await this.selectAgentResponsible('automation, Test', 1773265);

    await this.switchTab('postingContent');
    const time = String(Date.now());
    const titleField = this.page.locator(SubmitNewOrder.LOCATORS.jobTitle);
    await titleField.clear();
    await titleField.fill(`Job Title ${time}`);
    const locationField = this.page.locator(SubmitNewOrder.LOCATORS.jobLocationPosting);
    await locationField.clear();
    await locationField.fill('Boston');
    const payField = this.page.locator(SubmitNewOrder.LOCATORS.paySalaryRate);
    await payField.clear();
    await payField.fill('65000');
  }

  /**
   * Clicks "Pay Talent Overtime: Yes" if visible.
   */
  async payTalentOvertimeYes() {
    const button = this.page.locator(SubmitNewOrder.LOCATORS.payTalentOvertimeYes);
    if (await button.isVisible()) {
      await button.click();
    }
  }

  /**
   * Clicks "Bill Client Overtime: Yes" if visible.
   */
  async billClientOvertimeYes() {
    const button = this.page.locator(SubmitNewOrder.LOCATORS.billClientOvertimeYes);
    if (await button.isVisible()) {
      await button.click();
    }
  }
}

module.exports = { SubmitNewOrder };
