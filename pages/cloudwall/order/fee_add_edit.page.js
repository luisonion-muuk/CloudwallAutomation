const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Fee Add/Edit screen.
 */
class FeeAddEditScreen extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawEnterNewFee';
  static FEE_MISMATCH_ERROR = 'For this fee, the Client Amount and Talent Amount must be the same';

  static TAB_IDS = {
    newFee: 'newFee',
  };

  static LOCATORS = {
    feeType:                      '#feeType',
    feeDate:                      'input#feeDate',
    weekEndingSunday:             '#weSunday',
    approvedCheckBox:             '[name="approveCheckBox"]',
    manuallyPaid:                 '[name="manualPay"]',
    clientAmount:                 '[name="clientAmt"]',
    talentAmount:                 '[name="employeeAmt"]',
    salesTax:                     '[name="sales_tax"]',
    invoiceDescription:           '[name="invoiceDescription"]',
    internalComments:             '[name="internalComments"]',
    bcJurisdictionHours:          '#juris-40',
    localJurisHours:              '#hours-total',
    equivalentHours:              '[name="equivHours"]',
    equivalentHoursEditableLink:  '#equivalent-hours',
    equivalentHoursEditField:     '//a[@id="equivalent-hours"]//following::input[@class="input-medium"]',
    equivalentHoursSubmitButton:  '//a[@id="equivalent-hours"]//following::button[@class="btn btn-primary editable-submit"]',
    atlassianJurisdictionHours:   '#client-2',
    feeId:                        '//table/tbody/tr[3]/td[2]/table/tbody/tr[1]/td[2]',
    leftColumnRows:               '#TabPage > table > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr',
    leftColumnRowLabel:           'td.FieldLabel',
    leftColumnRowValue:           'td.FieldContent',
  };

  static FIELDS = {
    feeDate:                    { tab: 'newFee', type: 'text' },
    weekEndingSunday:           { tab: 'newFee', type: 'text' },
    feeType:                    { tab: 'newFee', type: 'select' },
    approvedCheckBox:           { tab: 'newFee', type: 'checkbox' },
    clientAmount:               { tab: 'newFee', type: 'text' },
    talentAmount:               { tab: 'newFee', type: 'text' },
    bcJurisdictionHours:        { tab: 'newFee', type: 'text' },
    localJurisHours:            { tab: 'newFee', type: 'text' },
    invoiceDescription:         { tab: 'newFee', type: 'text' },
    internalComments:           { tab: 'newFee', type: 'text' },
    equivalentHours:            { tab: 'newFee', type: 'text' },
    atlassianJurisdictionHours: { tab: 'newFee', type: 'text' },
    serviceTax:                 { tab: 'newFee', type: 'checkbox' },
  };

  /**
   * Dynamic XPath selectors that accept an ID parameter.
   */
  static SELECTORS = {
    /** @param {string} id - Sick time jurisdiction ID */
    jurisdictionRowById:   (id) => `//tr[./td[./input[@id="juris-${id}"]]]`,
    jurisdictionInputById: (id) => `//input[@id="juris-${id}"]`,

    /** @param {string} id - Sick time policy ID */
    policyRowById:   (id) => `//tr[./td[./input[@id="client-${id}"]]]`,
    policyInputById: (id) => `//input[@id="client-${id}"]`,
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The screen root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Clicks the Save button and accepts any browser dialog that appears.
   *
   * @returns {Promise<string|undefined>} The alert text if a dialog was present
   */
  async clickSaveAndAcceptDialogIfPresent() {
    const page = this.root.page();
    let alertText;
    const dialogHandler = (dialog) => {
      alertText = dialog.message();
      dialog.accept();
    };
    page.once('dialog', dialogHandler);

    await this.clickAsaba('Save');

    // Brief wait to allow any dialog to fire
    await page.waitForTimeout(500);
    return alertText;
  }

  /**
   * Clicks the Cancel button.
   */
  async clickCancel() {
    await this.clickAsaba('Cancel');
  }

  /**
   * Saves the fee, optionally setting the approved checkbox first.
   *
   * @param {Object} [opts={}]
   * @param {boolean} [opts.asApproved=true] - Whether to check the approved checkbox before saving
   * @returns {Promise<string|undefined>} The alert text if a dialog was present
   */
  async save({ asApproved = true } = {}) {
    await this.setField('approvedCheckBox', asApproved);
    return this.clickSaveAndAcceptDialogIfPresent();
  }

  /**
   * Collects label/value pairs from the left column of the fee screen.
   *
   * @returns {Promise<Object>} An object mapping snake_case label keys to their text values
   */
  async leftColumnData() {
    const rows = this.root.locator(FeeAddEditScreen.LOCATORS.leftColumnRows);
    const count = await rows.count();
    const data = {};

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const labelEl = row.locator(FeeAddEditScreen.LOCATORS.leftColumnRowLabel);
      const valueEl = row.locator(FeeAddEditScreen.LOCATORS.leftColumnRowValue);

      if (await labelEl.count() > 0) {
        const labelText = (await labelEl.textContent()).toLowerCase().trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '');

        let value = null;
        if (await valueEl.count() > 0) {
          value = (await valueEl.textContent()).trim();
        }

        data[labelText] = value;
      }
    }

    return data;
  }

  /**
   * Gets the hours available for a given jurisdiction ID.
   *
   * @param {string} jurisdictionId - See common_data SICK_TIME_JURISDICTIONS for ID mappings
   * @returns {Promise<string>} The available hours
   */
  async getHoursAvailableForJurisdiction(jurisdictionId) {
    const rowSelector = FeeAddEditScreen.SELECTORS.jurisdictionRowById(jurisdictionId);
    const row = this.root.locator(rowSelector);
    const text = await row.textContent();
    const match = text.match(/:(.*)hours available/);
    return match ? match[1].trim() : '';
  }

  /**
   * Sets the hours for a given jurisdiction input.
   *
   * @param {string} jurisdictionId - See common_data SICK_TIME_JURISDICTIONS for ID mappings
   * @param {string|number} hours - Hours to enter
   */
  async setHoursForJurisdiction(jurisdictionId, hours) {
    const inputSelector = FeeAddEditScreen.SELECTORS.jurisdictionInputById(jurisdictionId);
    const input = this.root.locator(inputSelector);
    await input.fill(String(hours));
  }

  /**
   * Gets the hours available for a given sick time policy ID.
   *
   * @param {string} policyId - See common_data SICK_TIME_POLICIES for ID mappings
   * @returns {Promise<string>} The available hours
   */
  async getHoursAvailableForPolicy(policyId) {
    const rowSelector = FeeAddEditScreen.SELECTORS.policyRowById(policyId);
    const row = this.root.locator(rowSelector);
    const text = await row.textContent();
    const match = text.match(/:(.*)hours available/);
    return match ? match[1].trim() : '';
  }

  /**
   * Sets the hours for a given sick time policy input.
   *
   * @param {string} policyId - See common_data SICK_TIME_POLICIES for ID mappings
   * @param {string|number} hours - Hours to enter
   */
  async setHoursForPolicy(policyId, hours) {
    const inputSelector = FeeAddEditScreen.SELECTORS.policyInputById(policyId);
    const input = this.root.locator(inputSelector);
    await input.fill(String(hours));
  }

  static PROC_MAPPINGS = [
    'AWUIDrawEnterNewFee',
    'AWUIDrawEditFee',
  ];
}

module.exports = { FeeAddEditScreen };
