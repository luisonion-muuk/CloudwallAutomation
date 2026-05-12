const { OrderEditDetail } = require('./order_edit_detail');
const { FillOrder } = require('./fill_order_modal');

/**
 * Page class that supports operations related to the Edit duplicate order page.
 */
class OrderDuplicateEditDetail extends OrderEditDetail {

  static PROC_NAME = 'AWUIDrawDuplicateOrder';

  static TAB_IDS = {
    summary:             'summary',
    positionDescription: 'position_description',
    financialInfo:       'financial_info',
    coalitionInfo:       'custom_fields',
  };

  static SELECTORS = {
    creditAgentOption: (id) => `div.creditsContainer div[val="${id}"]`,
  };

  static LOCATORS = {
    fillOrderBtn:            '#link_resubmitQuickFill',
    customFieldTab:          '//td[@tabid = "custom_fields"]',
    saveButton:              '#link_Save div',

    // Summary tab
    summEndDate:             '#endDate',
    summEndDateStatus:       '#orderEndDateStatusId',
    summOrderEndReason:      '#orderEndReasonId',
    summHowHeard:            '#howHeard',
    summCreditAgentNameField:'#newAgentId_input',
    summCreditPercentageField:'#newPercentage',
    summCreditAddButton:     '#add-new-credit-icon',
    summAccountManagerArrow: '#accountManagerId_arrow',
    summSalesManagerArrow:   '#salesManagerId_arrow',
    summServiceTaxArea:      '#service-area-tax-display',
    summStartDate:           '#startDate',
    summWorkLocationAddress: '#work-location-addr-display',
    summWorkLocationType:    '#work-location-type-display',
    summSegment:             '#minorSegment',
    summOrderStatus:         '#current-status',
    summOrderStatusId:       '#orderStatus',
    summParentOrderId:       '#parentOrderId',
    summCreateDate:          '#create-date',
    summOrderedBy:           '#orderedBy',
    summUsesDtr:             '#dtr',
    summBillTo:              '#billTo',
    summReportTo:            '#reportTo',
    summQccReviewerArrow:    '#qccReviewerId_arrow',
    summQccReviewerDropdown: '#qccReviewerId_ctr',
    summQccReviewerOption:   '#qccReviewerId_flexbox div',
    summExclusive:           '#exclusiveOrderStatus',
    summDirect:              '#directOrderStatus',

    // Financial info tab
    fiGrossPayRatesLabel:        '#gross-pay-rate-label',
    fiGrossPayRegular:           '#regularGrossPayRate',
    fiGrossPayOvertime:          '[name="OTGrossPayRate"]',
    fiGrossPayDoubleTime:        '[name="doubletimeGrossPayRate"]',
    fiPayTalentOvertimeYes:      '#payTalentOvertimeYesClick',
    fiPayTalentOvertimeNo:       '#payTalentOvertimeNoClick',
    fiBillClientOvertimeYes:     '#billClientForOvertimeYesClick',
    fiBillClientOvertimeNo:      '#billClientForOvertimeNoClick',

    // Coalition info (custom fields) tab
    ciOvertimeAllowed:           '#custom_field_4946',
    ciWorkLocation:              '#custom_field_4947',
    ciHoursPerWeek:              '#custom_field_4945',
    ciEmploymentType:            '#custom_field_4944',

    // Fields (used by setField / getField framework)
    fieldStartDate:              '#startDate',
    fieldEndDate:                '#endDate',
    fieldOrderedBy:              '#orderedBy',
    fieldReportTo:               '#reportTo',
    fieldPlacementType:          '#placementTypeList',
    fieldHowHeard:               '#howHeard',
    fieldSaveButton:             '#link_Save div',
    fieldPositionTitle:          '[name="title"]',
    fieldEndDateStatus:          '#orderEndDateStatusId',
    fieldOrderEndReason:         '#orderEndReasonId',
    fieldNotesForTheOnboarder:   '#notesForTheOnboarder',
    fieldExclusive:              '#exclusiveOrderStatus',
    fieldDirect:                 '#directOrderStatus',
    fieldHoursPerWeek:           '#custom_field_4945',

    // Fill order modal
    fillOrderModal:              '#fill-order-modal',
  };

  static FIELDS = {
    startDate:            { tab: 'summary', type: 'text' },
    endDate:              { tab: 'summary', type: 'text' },
    orderedBy:            { tab: 'summary', type: 'select' },
    reportTo:             { tab: 'summary', type: 'select' },
    placementType:        { tab: 'summary', type: 'select' },
    howHeard:             { tab: 'summary', type: 'select' },
    saveButton:           { tab: 'summary', type: 'clickLocator' },
    positionTitle:        { tab: 'positionDescription', type: 'text' },
    endDateStatus:        { tab: 'summary', type: 'select' },
    orderEndReason:       { tab: 'summary', type: 'select' },
    notesForTheOnboarder: { tab: 'positionDescription', type: 'text' },
    exclusive:            { tab: 'financialInfo', type: 'select' },
    direct:               { tab: 'financialInfo', type: 'select' },
    hoursPerWeek:         { tab: 'coalitionInfo', type: 'text' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawDuplicateOrder',
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
   * Formats a Date to MM/DD/YYYY string.
   * @param {Date} date
   * @returns {string}
   * @private
   */
  _formatDate(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}/${d}/${date.getFullYear()}`;
  }

  /**
   * Selects the last available option in a given select element.
   *
   * @param {string} tabKey - Tab containing the select (unused for lookup, kept for API compat)
   * @param {string} locatorKey - Key from LOCATORS for the select element
   */
  async selectLastOption(tabKey, locatorKey) {
    const select = this.page.locator(OrderDuplicateEditDetail.LOCATORS[locatorKey]);
    const options = select.locator('option');
    const count = await options.count();
    const lastValue = await options.nth(count - 1).getAttribute('value');
    await select.selectOption(lastValue);
  }

  /**
   * Sets fields to complete the duplicate order process after the modal has been closed.
   *
   * @param {Object} data
   * @param {string} [data.startDate] - MM/DD/YYYY or parseable date string
   * @param {number} [data.endDateDays=455]
   * @param {string} [data.accountManager='Automation, Test']
   * @param {string} [data.exclusive='1']
   * @param {string} [data.direct='1']
   * @param {Object} [data.howHeard] - { value: string }
   * @param {Object} [data.creditAgent] - { name: string, id: string|number }
   * @param {string} [data.notesForTheOnboarder]
   * @param {number|string} [data.minimumPayRate]
   * @param {number|string} [data.maximumPayRate]
   * @param {number|string} [data.minimumBillRate]
   * @param {number|string} [data.maximumBillRate]
   * @param {boolean} [data.requiresOnboarding]
   */
  async completeDuplicateOrderEdit(data) {
    // Defaults
    const startDateStr = data.startDate || this._formatDate(new Date(Date.now() + 90 * 86400000));
    const endDateDays = data.endDateDays ?? 455;
    const accountManager = data.accountManager || 'Automation, Test';
    const exclusive = data.exclusive || '1';
    const direct = data.direct || '1';
    const howHeardValue = data.howHeard?.value || '1032'; // Sales Initiated Business

    // Parse start date
    let startDate;
    if (/^[a-zA-Z]+$/.test(startDateStr)) {
      startDate = new Date(startDateStr);
    } else {
      const [month, day, year] = startDateStr.split('/');
      startDate = new Date(year, month - 1, day);
    }
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + endDateDays);

    await this.switchTab('summary');
    await this.setStartDate(startDate);
    await this.setEndDate(endDate);

    const endDateStatusEl = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summEndDateStatus);
    if (await endDateStatusEl.isVisible()) {
      await endDateStatusEl.selectOption({ value: '2' }); // pending extension
    }

    await this.setAccountManagerByArrow(accountManager);
    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.summHowHeard)
      .selectOption({ value: howHeardValue });

    if (data.creditAgent?.name && data.creditAgent?.id) {
      await this.addOrderCredit(data.creditAgent.name, data.creditAgent.id, 100);
    } else {
      await this.addOrderCreditDefault();
    }

    if (data.notesForTheOnboarder) {
      await this.setField('notesForTheOnboarder', data.notesForTheOnboarder);
    }

    await this.setOrderIntakeStatusDropdown();

    await this.setMinimumPayRate(data.minimumPayRate);
    await this.setMaximumPayRate(data.maximumPayRate);
    await this.setMinimumBillRate(data.minimumBillRate);
    await this.setMaximumBillRate(data.maximumBillRate);

    await this.switchTab('financialInfo');
    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.summExclusive)
      .selectOption({ value: exclusive });
    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.summDirect)
      .selectOption({ value: direct });

    await this.clickSaveButton();

    if (data.requiresOnboarding) {
      await this.clickAsaba('provisionalDuplicateOrder');
    }
  }

  /**
   * Sets onboarding notes on the position description tab.
   *
   * @param {string|null} textInput
   */
  async setOnboardingNotes(textInput = 'Test onboarder notes') {
    await this.switchTab('positionDescription');
    await this.setField('notesForTheOnboarder', textInput);
  }

  /**
   * Sets the start date field.
   *
   * @param {Date} startDate
   */
  async setStartDate(startDate) {
    const field = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summStartDate);
    await field.clear();
    await field.fill(this._formatDate(startDate));
  }

  /**
   * Sets the end date field.
   *
   * @param {Date} endDate
   */
  async setEndDate(endDate) {
    const field = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summEndDate);
    await field.clear();
    await field.fill(this._formatDate(endDate));
  }

  /**
   * Clicks the Save button, accepting any alerts that appear.
   */
  async clickSaveButton() {
    const page = this.page;
    const dialogHandler = (dialog) => dialog.accept();
    page.on('dialog', dialogHandler);

    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.saveButton).click();

    // Brief wait for potential second alert
    await page.waitForTimeout(500);
    page.off('dialog', dialogHandler);
  }

  /**
   * Saves and fills the order with the given talent and work location.
   *
   * @param {string} talentId
   * @param {string} workLocation
   */
  async saveAndFill(talentId, workLocation) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('quickFill');

    const modal = new FillOrder(this.page.locator(OrderDuplicateEditDetail.LOCATORS.fillOrderModal));
    await modal.setTalentId(talentId);
    await modal.setWorkLocationType(workLocation);
    await modal.taxAreaSelectLastOption();
    await modal.submitWorkLocationChange();
    await this.checkAndDismissAutoRejectionEmailModal();
  }

  /**
   * Ensures the "Uses DTR" checkbox is checked.
   */
  async usesDtrTrue() {
    const checkbox = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summUsesDtr);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  /**
   * Sets the "Uses DTR" checkbox to a specific state.
   *
   * @param {boolean} value
   */
  async setUsesDtr(value) {
    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.summUsesDtr).setChecked(value);
  }

  /**
   * Clicks "Pay Talent Overtime: Yes" if visible.
   */
  async payTalentOvertimeYes() {
    const button = this.page.locator(OrderDuplicateEditDetail.LOCATORS.fiPayTalentOvertimeYes);
    if (await button.isVisible()) {
      await button.click();
    }
  }

  /**
   * Clicks "Bill Client Overtime: Yes" if visible.
   */
  async billClientOvertimeYes() {
    const button = this.page.locator(OrderDuplicateEditDetail.LOCATORS.fiBillClientOvertimeYes);
    if (await button.isVisible()) {
      await button.click();
    }
  }

  /**
   * Adds an order credit assignment.
   *
   * @param {string} agentName
   * @param {string|number} agentPersonId
   * @param {number|string} percentage
   */
  async addOrderCredit(agentName, agentPersonId, percentage) {
    const nameField = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summCreditAgentNameField);
    await nameField.clear();
    await nameField.fill(String(agentName));

    const optionSelector = OrderDuplicateEditDetail.SELECTORS.creditAgentOption(agentPersonId);
    await this.page.locator(optionSelector).waitFor({ state: 'visible' });
    await this.page.locator(optionSelector).click();

    const pctField = this.page.locator(OrderDuplicateEditDetail.LOCATORS.summCreditPercentageField);
    await pctField.fill(String(percentage));
    await this.page.locator(OrderDuplicateEditDetail.LOCATORS.summCreditAddButton).click();
  }

  /**
   * Adds the default order credit (Automation, Test).
   */
  async addOrderCreditDefault() {
    await this.addOrderCredit('Automation, Test', 1773265, '100');
  }
}

module.exports = { OrderDuplicateEditDetail };
