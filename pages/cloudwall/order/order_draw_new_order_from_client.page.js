const { LegacyActionScreen } = require('../legacy_action_screen');
const { FillOrder } = require('./fill_order_modal');
const { Select2 } = require('../../elements/select2_element');

/**
 * Page class that supports operations related to the draw new order page in the client record.
 *
 * ATTENTION: PLEASE USE THE CREATE ORDER METHODS IN ORDER_UTIL.
 * DO NOT DUPLICATE HERE OR IN SPEC FILES.
 */
class OrderDrawNewOrderFromClient extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawNewOrderFromClient';

  static TAB_IDS = {
    summary:             'summary',
    positionDescription: 'position_description',
    financialInfo:       'financial_info',
    customFields:        'custom_fields',
    diversity:           'diversity',
  };

  /**
   * Dynamic selectors that accept an interpolated value.
   */
  static SELECTORS = {
    creditAgentOption:   (id) => `div.creditsContainer div[val="${id}"]`,
    qccReviewerOption:   (id) => `#qccReviewerId_flexbox div[val="${id}"]`,
    salesManagerId:      (id) => `#salesManagerId_ctr > div > div[val="${id}"]`,
    orderAssistedById:   (id) => `#assistedById_ctr > div > div[val="${id}"]`,
    collaboratorValue:   (id) => `.selectize-dropdown-content > div[data-value="${id}"]`,
  };

  static LOCATORS = {
    fillOrderModal:            '#fill-order-modal',
    recordLabel:               '.RecordLabel',
    saveAndFill:               '#link_quickFill',

    // Summary tab
    summClientName:            '#client-name-link a',
    summMarket:                '//div[@pageid="summary"]//td[contains(text(), "Market: ")]/following-sibling::td',
    summStartDate:             '#startDate',
    summEndDate:               '#endDate',
    summBillTo:                '#billTo',
    summOrderedBy:             '#orderedBy',
    summReportTo:              '#reportTo',
    summQccReviewer:           '#qccReviewerId_input',
    summOffSitePreference:     '#offSitePreferenceId',
    summOrderStatus:           '#orderStatus',
    summPlacementType:         '#placementTypeList',
    summImportance:            '#orderImportance',
    summAccountManager:        '#accountManagerId_input',
    summAccountManagerArrow:   '#accountManagerId_arrow',
    summAccountManagerDropdown:'#accountManagerId_ctr',
    summSalesManagerArrow:     '#salesManagerId_arrow',
    summFulfillmentManagerArrow:'#fulfillmentManagerId_arrow',
    summAssistedByArrow:       '#assistedById_arrow',
    summAssistedByDropdown:    '#assistedById_ctr',
    summReasonCreated:         '#reasonCreated',
    summHowHeard:              '#howHeard',
    summBossOfReportTo:        '#japanBossOfReportToId',
    summContractContact:       '#japanContractContactId',
    summClaimsContact:         '#japanClaimsContactId',
    summLaborDepartmentCategory: '#japanLaborDepartmentCategory',
    summPayTypeContractor:     '#employeeType',
    summCreditAgentNameField:  '#newAgentId_input',
    summCreditPercentageField: '#newPercentage',
    summCreditAddButton:       '#add-new-credit-icon',
    summDisableAutomatedCheckin: '#disableAutomatedCheckin',
    summClientDisabledCheckin: '#client-disabled-checkins',
    summPaidByUmbrellaCompany: '#paidByUmbrellaCompany',
    summIsIr35:                '#is_ir35',
    summIr35Satisfied:         '#is_ir35_satisfied',
    summOnboardingComplete:    '[name="onboardingComplete"]',
    summUsCanOnboardingComplete: '[name="usCanOnboardingComplete"]',
    summUsesDtr:               '#dtr',

    // Position Description tab
    pdInternalOrderInfo:       'textarea[name="internalOrderInfo"]',
    pdPositionTitle:           '[name="title"]',
    pdNotesForTheOnboarder:    '#notesForTheOnboarder',
    pdSubmittalDetails:        'textarea[name="submittalDetails"]',
    pdOrderIntakeStatusDropdown: '#orderIntakeStatus',
    pdMinorSegmentSelect2:     '#s2id_minorSegment',
    pdMinorSegmentSelect2Input:'#s2id_autogen4_search',
    pdMinorSegmentSelect2Label:'//\u002a[@id="s2id_minorSegment"]/label',
    pdMinorSegmentSelect2TypeAhead: '#select2-results-4',
    pdMinorSegment:            '#practiceGroupId',

    // Financial Info tab
    fiPayType:                 'input[name="employeeType"][value="1"]',
    fiRegularPayRate:          '#regularPayRate',
    fiRegularBillRate:         '#regularBillRate',
    fiDailyPayRate:            '#dailyPayRate',
    fiDailyBillRate:           '#dailyBillRate',
    fiPurchaseOrderSelect2:    '#s2id_purchaseOrder',
    fiPurchaseOrderSelect2Label: '//\u002a[@id="s2id_purchaseOrder"]/label',
    fiPurchaseOrderSelect2Input: '#s2id_autogen5_search',
    fiPurchaseOrderSelect2TypeAhead: '#select2-results-5',
    fiNewPo:                   '#link_newPO',
    fiSavePurchaseOrder:       '#save-purchase-order',
    fiPayFrequency:            '#japanPayFrequency',
    fiExclusive:               '#exclusiveOrderStatus',
    fiDirect:                  '#directOrderStatus',
    fiMaximumSalary:           '#salaryMaximum',
    fiMinimumSalary:           '#salaryMinimum',
    fiMinimumPayRate:          '#minPayInput',
    fiMaximumPayRate:          '#maxPayInput',
    fiMinimumBillRate:         '#minBillRateInput',
    fiMaximumBillRate:         '#maxBillRate',
    fiSubmittalRangeTypeTemp:  '#submittal-range-type-temp',
    fiSubmittalRangeTypePerm:  '#submittal-range-type-perm',
    fiPermPercent:             '[name="permPercent"]',
    fiAmountBilled:            '[name="amountBilled"]',
    fiAmountPaid:              '[name="amountPaid"]',
    fiProjectMarkup:           '[name="projectMarkup"]',
    fiPayRateLabel:            '#payRateLabel',
    fiBillRateLabel:           '#billRateLabel',
    fiRateType:                '[name="rateType"]',

    // Fields (used by setField / getField framework)
    fieldBossOfReportTo:       '#japanBossOfReportToId',
    fieldContractContact:      '#japanContractContactId',
    fieldClaimsContact:        '#japanClaimsContactId',
    fieldLaborDepartmentCategory: '#japanLaborDepartmentCategory',
    fieldOrderPriority:        '#priority',
    fieldMaxCandidates:        '#maxCandidates',
    fieldStartDate:            '#startDate',
    fieldEndDate:              '#endDate',
    fieldSegments:             '#practiceGroupId',
    fieldPlacementType:        '#placementTypeList',
    fieldImportance:           '#orderImportance',
    fieldBillTo:               '#billTo',
    fieldOrderedBy:            '#orderedBy',
    fieldReportTo:             '#reportTo',
    fieldOffSitePreference:    '#offSitePreferenceId',
    fieldOrderStatus:          '#orderStatus',
    fieldReasonCreated:        '#reasonCreated',
    fieldHowHeard:             '#howHeard',
    fieldQccReviewer:          '#qccReviewerId_input',
    fieldCollaboratorsInput:   '#collaborators-select-selectized',
    fieldSpecificDirections:   '[name="specificDirections"]',
    fieldAccountManager:       '#accountManagerId_input',
    fieldSalesManager:         '#salesManagerId_input',
    fieldOrderAssistedBy:      '#assistedById_input',
    fieldPayTypeIc:            'input[name="employeeType"][value="1"]',
    fieldPayTypeW2:            'input[name="employeeType"][value="2"]',
    fieldNumberOfOpenings:     '#numberOfOpenings',
    fieldAgentNameField:       '#newAgentId_input',
    fieldFirstAgentListed:     '#newAgentId_ctr',
    fieldPercentageField:      '#newPercentage',
    fieldAddNewCreditButton:   '#add-new-credit-icon',
    fieldHowHeardOther:        '#howHeardOther',
    fieldPaidByUmbrellaCompany:'#paidByUmbrellaCompany',
    fieldPositionTitle:        '[name="title"]',
    fieldMacJobTitle:          '[name="friendlyTitle"]',
    fieldInternalOrderInfo:    'textarea[name="internalOrderInfo"]',
    fieldNotesForTheOnboarder: '#notesForTheOnboarder',
    fieldOnboardingComplete:   '[name="onboardingComplete"]',
    fieldUsCanOnboardingComplete: '[name="usCanOnboardingComplete"]',
    fieldAssessment:           '#skill_select',
    fieldAssessmentGrade:      '#skill_grade',
    fieldAddAssessment:        '#addButton',
    fieldSkillsSearch:         '#s2id_skills',
    fieldFullTextSearch:       '[name="keywords"]',
    fieldOrderInfoOnMac:       '[name="clientJobDesc"]',
    fieldOrderInfoOnMat:       '[name="externalOrderInfo"]',
    fieldMatJobId:             '[name="myAquentIdentifier"]',
    fieldMinorSegment:         '#practiceGroupId',
    fieldInvoiceFrequency:     '#invoiceFrequency',
    fieldPointAccelerator:     '[name="pointAccelerator"]',
    fieldOrderInvoiceInfo:     '[name="orderInvoiceInfo"]',
    fieldHoursPerWeek:         '#hoursPerWeek',
    fieldRegularPayRate:       '#regularPayRate',
    fieldRegularBillRate:      '#regularBillRate',
    fieldDailyPayRate:         '#dailyPayRate',
    fieldDailyBillRate:        '#dailyBillRate',
    fieldPoNumber:             '#po_poNumber',
    fieldPoExpDate:            '#po_expDate',
    fieldPoMaxAmount:          '#po_maxAmount',
    fieldRateType:             '[name="rateType"]',
    fieldPayFrequency:         '#japanPayFrequency',
    fieldExclusiveStatus:      '#exclusiveOrderStatus',
    fieldDirectStatus:         '#directOrderStatus',
    fieldMaximumSalary:        '#salaryMaximum',
    fieldMinimumSalary:        '#salaryMinimum',
    fieldMinimumPayRate:       '#minPayInput',
    fieldMaximumPayRate:       '#maxPayInput',
    fieldMinimumBillRate:      '#minBillRateInput',
    fieldMaximumBillRate:      '#maxBillRate',
    fieldSubmittalRangeTypeTemp: '#submittal-range-type-temp',
    fieldSubmittalRangeTypePerm: '#submittal-range-type-perm',
    fieldOrderIntakeStatusDropdown: '#orderIntakeStatus',
    fieldPermPercent:          '[name="permPercent"]',
    fieldCustomFieldParagraph: 'textarea.custom-field-paragraph',
    fieldCustomFieldsHoursPerWeek: '#custom_field_4906',

    // Custom fields tab
    cfContent:                 '#ContentSection',
    cfCustomFieldParagraph:    'textarea.custom-field-paragraph',
    cfOvertimeAllowed:         '#custom_field_4907',
    cfWorkLocation:            '#custom_field_4908',
    cfHoursPerWeek:            '#custom_field_4906',
    cfEmploymentType:          '#custom_field_4905',

    // Diversity tab
    divHasDiversityCheckbox:   '#hasDiversityCheckbox',
    divGenderFemale:           '#genderCheckboxFemale',
  };

  static FIELDS = {
    orderPriority:          { tab: 'summary', type: 'select' },
    maxCandidates:          { tab: 'summary', type: 'select' },
    placementType:          { tab: 'summary', type: 'select' },
    importance:             { tab: 'summary', type: 'select' },
    startDate:              { tab: 'summary', type: 'text' },
    endDate:                { tab: 'summary', type: 'text' },
    billTo:                 { tab: 'summary', type: 'select' },
    orderedBy:              { tab: 'summary', type: 'select' },
    reportTo:               { tab: 'summary', type: 'select' },
    bossOfReportTo:         { tab: 'summary', type: 'select' },
    contractContact:        { tab: 'summary', type: 'select' },
    claimsContact:          { tab: 'summary', type: 'select' },
    laborDepartmentCategory:{ tab: 'summary', type: 'select' },
    offSitePreference:      { tab: 'summary', type: 'select' },
    orderStatus:            { tab: 'summary', type: 'select' },
    reasonCreated:          { tab: 'summary', type: 'select' },
    howHeard:               { tab: 'summary', type: 'select' },
    qccReviewer:            { tab: 'summary', type: 'text' },
    specificDirections:     { tab: 'summary', type: 'text' },
    accountManager:         { tab: 'summary', type: 'select' },
    salesManager:           { tab: 'summary', type: 'text' },
    orderAssistedBy:        { tab: 'summary', type: 'text' },
    payTypeIc:              { tab: 'summary', type: 'clickLocator' },
    payTypeW2:              { tab: 'summary', type: 'clickLocator' },
    numberOfOpenings:       { tab: 'summary', type: 'text' },
    agentNameField:         { tab: 'summary', type: 'text' },
    firstAgentListed:       { tab: 'summary', type: 'waitFindClick' },
    percentageField:        { tab: 'summary', type: 'text' },
    addNewCreditButton:     { tab: 'summary', type: 'clickLocator' },
    howHeardOther:          { tab: 'summary', type: 'text' },
    paidByUmbrellaCompany:  { tab: 'summary', type: 'checkbox' },
    positionTitle:          { tab: 'positionDescription', type: 'text' },
    macJobTitle:            { tab: 'positionDescription', type: 'text' },
    assessment:             { tab: 'positionDescription', type: 'select' },
    assessmentGrade:        { tab: 'positionDescription', type: 'text' },
    skillsSearch:           { tab: 'positionDescription', type: 'select2' },
    fullTextSearch:         { tab: 'positionDescription', type: 'text' },
    internalOrderInfo:      { tab: 'positionDescription', type: 'text' },
    notesForTheOnboarder:   { tab: 'positionDescription', type: 'text' },
    onboardingComplete:     { tab: 'summary', type: 'checkbox' },
    usCanOnboardingComplete:{ tab: 'summary', type: 'checkbox' },
    orderInfoOnMac:         { tab: 'positionDescription', type: 'text' },
    orderInfoOnMat:         { tab: 'positionDescription', type: 'text' },
    matJobId:               { tab: 'positionDescription', type: 'text' },
    orderIntakeStatusDropdown: { tab: 'positionDescription', type: 'select' },
    minorSegment:           { tab: 'positionDescription', type: 'select' },
    segments:               { tab: 'positionDescription', type: 'select' },
    invoiceFrequency:       { tab: 'financialInfo', type: 'select' },
    pointAccelerator:       { tab: 'financialInfo', type: 'text' },
    orderInvoiceInfo:       { tab: 'financialInfo', type: 'text' },
    hoursPerWeek:           { tab: 'financialInfo', type: 'text' },
    regularPayRate:         { tab: 'financialInfo', type: 'text' },
    regularBillRate:        { tab: 'financialInfo', type: 'text' },
    dailyPayRate:           { tab: 'financialInfo', type: 'text' },
    dailyBillRate:          { tab: 'financialInfo', type: 'text' },
    poNumber:               { tab: 'financialInfo', type: 'text' },
    poExpDate:              { tab: 'financialInfo', type: 'text' },
    poMaxAmount:            { tab: 'financialInfo', type: 'text' },
    rateType:               { tab: 'financialInfo', type: 'radio' },
    payFrequency:           { tab: 'financialInfo', type: 'select' },
    exclusiveStatus:        { tab: 'financialInfo', type: 'select' },
    directStatus:           { tab: 'financialInfo', type: 'select' },
    maximumSalary:          { tab: 'financialInfo', type: 'text' },
    minimumSalary:          { tab: 'financialInfo', type: 'text' },
    minimumPayRate:         { tab: 'financialInfo', type: 'text' },
    maximumPayRate:         { tab: 'financialInfo', type: 'text' },
    minimumBillRate:        { tab: 'financialInfo', type: 'text' },
    maximumBillRate:        { tab: 'financialInfo', type: 'text' },
    submittalRangeTypeTemp: { tab: 'financialInfo', type: 'radio' },
    submittalRangeTypePerm: { tab: 'financialInfo', type: 'radio' },
    permPercent:            { tab: 'financialInfo', type: 'text' },
    customFieldParagraph:   { tab: 'customFields', type: 'text' },
    customFieldsHoursPerWeek: { tab: 'customFields', type: 'text' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawNewOrderFromClient',
  ];

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  // --- Helper ---

  /**
   * Formats a Date to MM/DD/YYYY string.
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}/${d}/${date.getFullYear()}`;
  }

  // --- Required order fields ---

  /**
   * Sets required order fields with default values if no data passed.
   *
   * @param {Object} orderData
   */
  async setRequiredOrderFields(orderData) {
    await this.setPositionTitle(orderData.positionTitle || orderData.orderName);
    await this.setContacts(orderData.contactId);
    await this.setStartDate(orderData.startDate);
    await this.setEndDate(orderData.endDate);
    await this.setOffSitePreference(orderData.offSitePreference);
    await this.setSegment(orderData.minorSegment, orderData.minorSegmentId);
    await this.setOrderStatus(orderData.orderStatus);
    await this.setReasonCreated(orderData.reasonCreated);
    await this.setHowHeard(orderData.howHeard);
    await this.setInternalOrderInfo(orderData.internalOrderInfo);
    await this.setOnboardingComplete(orderData.completeOnboarding);
    await this.setOnboardingNotes(orderData.onboardingNotes);
    await this.setOrderIntakeStatusDropdown(orderData.orderIntakeStatusDropdown);

    if (orderData.addOrderCredit) {
      await this.addOrderCredit(...orderData.addOrderCredit);
    } else {
      await this.addOrderCreditDefault();
    }

    await this.enterFinancialInfo(orderData.financialInfo);
  }

  /**
   * Sets optional order fields from data.
   *
   * @param {Object} orderData
   */
  async setOptionalOrderFields(orderData) {
    if (orderData.payTypeContractor) await this.setPayTypeContractor();
    await this.setUseDtrTimecard(orderData.useDtrTimecards);
    if (orderData.placementType) await this.setPlacementType(orderData.placementType);
    if (orderData.orderImportance) await this.setOrderImportance(orderData.orderImportance);
    if (orderData.numberOfOpenings) await this.setField('numberOfOpenings', orderData.numberOfOpenings);
    if (orderData.accountManager) await this.setAccountManagerByArrow(orderData.accountManager);
    if (orderData.salesManager) await this.setSalesManagerByArrow(orderData.salesManager);
    if (orderData.fulfillmentManager) await this.setFulfillmentManagerByArrow(orderData.fulfillmentManager);
    if (orderData.assistedBy) await this.setAssistedByArrow(orderData.assistedBy);
  }

  async setUkSpecificFields() {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summPaidByUmbrellaCompany).click();
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summIsIr35).click();
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summIr35Satisfied).click();
  }

  // --- Order credit ---

  async addOrderCreditDefault() {
    await this.addOrderCredit('Automation, Test', 1773265, '100');
  }

  /**
   * Adds an order credit assignment.
   *
   * @param {string} agentName
   * @param {number} agentPersonId
   * @param {string} percentage
   */
  async addOrderCredit(agentName = 'Automation, Test', agentPersonId = 1773265, percentage = '100') {
    await this.switchTab('summary');

    const nameField = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summCreditAgentNameField);
    await nameField.clear();
    await nameField.fill(String(agentName));

    const optionSelector = OrderDrawNewOrderFromClient.SELECTORS.creditAgentOption(agentPersonId);
    await this.page.locator(optionSelector).waitFor({ state: 'visible' });
    await this.page.locator(optionSelector).click();

    const pctField = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summCreditPercentageField);
    await pctField.fill(String(percentage));
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summCreditAddButton).click();
  }

  // --- Date fields ---

  /**
   * Sets the order start date. Defaults to last Monday if not provided.
   *
   * @param {Date|string|null} startDate
   */
  async setStartDate(startDate = null) {
    await this.switchTab('summary');
    if (!startDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToLastMonday - 7);
    }
    const formatted = typeof startDate === 'string' ? startDate : this._formatDate(startDate);
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summStartDate);
    await field.clear();
    await field.fill(formatted);
  }

  /**
   * Sets the order end date. Defaults to 30 days from now if not provided.
   *
   * @param {Date|string|null} endDate
   */
  async setEndDate(endDate = null) {
    await this.switchTab('summary');
    if (!endDate) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }
    const formatted = typeof endDate === 'string' ? endDate : this._formatDate(endDate);
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summEndDate);
    await field.clear();
    await field.fill(formatted);
  }

  // --- Contacts ---

  /**
   * Sets bill_to, ordered_by, and report_to contacts.
   * Selects first option if no contact ID provided.
   *
   * @param {string|null} contactId
   */
  async setContacts(contactId = null) {
    await this.switchTab('summary');
    if (contactId) {
      await this.setField('billTo', contactId);
      await this.setField('orderedBy', contactId);
      await this.setField('reportTo', contactId);
    } else {
      for (const sel of [
        OrderDrawNewOrderFromClient.LOCATORS.summBillTo,
        OrderDrawNewOrderFromClient.LOCATORS.summOrderedBy,
        OrderDrawNewOrderFromClient.LOCATORS.summReportTo,
      ]) {
        const select = this.page.locator(sel);
        const firstOption = select.locator('option:not([value=""])').first();
        const value = await firstOption.getAttribute('value');
        await select.selectOption(value);
      }
    }
  }

  // --- Summary dropdowns ---

  /**
   * @param {string|null} pref - Numeric string (default '3' = on-site or remote)
   */
  async setOffSitePreference(pref = '3') {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summOffSitePreference)
      .selectOption({ value: pref });
  }

  /**
   * @param {string} placementType - Numeric string
   */
  async setPlacementType(placementType) {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summPlacementType)
      .selectOption({ value: String(placementType) });
  }

  /**
   * @param {string|null} orderStatus - Numeric string (default '2' = new)
   */
  async setOrderStatus(orderStatus = '2') {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summOrderStatus)
      .selectOption({ value: orderStatus });
  }

  /**
   * @param {string|null} reasonCreated - Numeric string (default '1' = net new position)
   */
  async setReasonCreated(reasonCreated = '1') {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summReasonCreated)
      .selectOption({ value: reasonCreated });
  }

  /**
   * @param {string|null} howHeard - Numeric string (default '1031' = client initiated business)
   */
  async setHowHeard(howHeard = '1031') {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summHowHeard)
      .selectOption({ value: howHeard });
  }

  /**
   * @param {string} orderImportance - Numeric string
   */
  async setOrderImportance(orderImportance) {
    await this.switchTab('summary');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summImportance)
      .selectOption({ value: orderImportance });
  }

  /**
   * @param {string|null} minorSegment - Numeric string (default '88')
   */
  async setMinorSegment(minorSegment = '88') {
    await this.switchTab('positionDescription');
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdMinorSegment)
      .selectOption({ value: minorSegment });
  }

  // --- Position description ---

  /**
   * @param {string|null} positionTitle
   */
  async setPositionTitle(positionTitle = null) {
    const time = String(Date.now());
    positionTitle = positionTitle || `auto Position Title ${time}`;
    await this.switchTab('positionDescription');
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdPositionTitle);
    await field.clear();
    await field.fill(positionTitle);
  }

  /**
   * @param {string|null} internalOrderInfo
   */
  async setInternalOrderInfo(internalOrderInfo = null) {
    const time = String(Date.now());
    internalOrderInfo = internalOrderInfo || `auto Internal Order Info ${time}`;
    await this.switchTab('positionDescription');
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdInternalOrderInfo);
    await field.clear();
    await field.fill(internalOrderInfo);
  }

  /**
   * @param {string|null} textInput
   */
  async setOnboardingNotes(textInput = null) {
    await this.switchTab('positionDescription');
    textInput = textInput || `default onboarding note ${Date.now()}`;
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdNotesForTheOnboarder).fill(textInput);
  }

  /**
   * @param {string|null} orderIntakeStatus - Numeric string (default '1' = Recorded)
   */
  async setOrderIntakeStatusDropdown(orderIntakeStatus = '1') {
    if (await this.readFeature('order-intake-status')) {
      await this.switchTab('positionDescription');
      await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdOrderIntakeStatusDropdown)
        .selectOption({ value: orderIntakeStatus });
    }
  }

  /**
   * Sets the practice group via Select2.
   *
   * @param {string|null} content - Defaults to 'Creative Director'
   */
  async setPracticeSelect2(content = 'Creative Director') {
    await this.switchTab('positionDescription');
    const select = new Select2(this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdMinorSegmentSelect2));
    await select.setSearchText(content);
    await select.selectResultByNumber(1);
  }

  // --- Onboarding ---

  /**
   * Sets onboarding complete checkbox(es).
   *
   * @param {boolean|null} value - Defaults to true
   */
  async setOnboardingComplete(value = true) {
    await this.switchTab('summary');

    const intlCheckbox = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summOnboardingComplete);
    const usCanCheckbox = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summUsCanOnboardingComplete);

    if (await intlCheckbox.count() > 0) {
      await intlCheckbox.first().setChecked(value);
    } else if (await usCanCheckbox.count() > 0) {
      await usCanCheckbox.first().setChecked(value);
    }
  }

  // --- Pay type ---

  async setPayTypeContractor() {
    await this.switchTab('summary');
    const checkbox = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summPayTypeContractor);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  // --- DTR ---

  /**
   * @param {boolean|null} useDtr
   */
  async setUseDtrTimecard(useDtr) {
    if (useDtr == null) return;
    await this.switchTab('summary');
    const checkbox = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summUsesDtr);
    if (useDtr) {
      if (!(await checkbox.isChecked())) await checkbox.click();
    } else {
      if (await checkbox.isChecked()) await checkbox.click();
    }
  }

  // --- Umbrella company ---

  async setPaidByUmbrellaCompany() {
    await this.switchTab('summary');
    const checkbox = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summPaidByUmbrellaCompany);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  // --- Financial info ---

  /**
   * Clears and types a value into a financial info field using backspace approach.
   *
   * @param {string|number} value
   * @param {string} locatorKey
   */
  async typeFinancialValue(value, locatorKey) {
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS[locatorKey]);
    await field.click();
    await field.clear();
    await field.fill(String(value));
    await field.press('Enter');
  }

  /**
   * Sets the minimum pay rate if the feature flag is enabled and current value <= 0.
   *
   * @param {number|string} [minPay=20]
   * @param {boolean} [overrideExistingRate=false]
   */
  async setMinimumPayRate(minPay = 20, overrideExistingRate = false) {
    if (await this.readFeature('applicant-pay-transparency')) {
      await this.switchTab('financialInfo');
      const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiMinimumPayRate);
      const currentValue = parseFloat((await field.inputValue()).replace(/[^\d.]/g, '') || '0');
      if (currentValue <= 0 || overrideExistingRate) {
        await this.setField('minimumPayRate', minPay);
      }
    }
  }

  /**
   * Sets the maximum pay rate if the feature flag is enabled and current value <= 0.
   *
   * @param {number|string} [maxPay=25]
   * @param {boolean} [overrideExistingRate=false]
   */
  async setMaximumPayRate(maxPay = 25, overrideExistingRate = false) {
    if (await this.readFeature('applicant-pay-transparency')) {
      await this.switchTab('financialInfo');
      const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiMaximumPayRate);
      const currentValue = parseFloat((await field.inputValue()).replace(/[^\d.]/g, '') || '0');
      if (currentValue <= 0 || overrideExistingRate) {
        await this.setField('maximumPayRate', maxPay);
      }
    }
  }

  /**
   * Sets the submittal range type radio button if visible.
   *
   * @param {string} [rangeType='temp']
   */
  async setSubmittalRangeType(rangeType = 'temp') {
    await this.switchTab('financialInfo');
    const tempButton = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiSubmittalRangeTypeTemp);
    if (await tempButton.isVisible()) {
      if (rangeType.toLowerCase() === 'perm') {
        await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiSubmittalRangeTypePerm).click();
      } else {
        await tempButton.click();
      }
    }
  }

  /**
   * Enters financial info with defaults or overrides.
   *
   * @param {Object|null} financialInfo
   */
  async enterFinancialInfo(financialInfo = null) {
    const aptFeature = await this.readFeature('applicant-pay-transparency');

    financialInfo = financialInfo || {};
    financialInfo.rateType = financialInfo.rateType ?? 1;
    financialInfo.submittalRangeType = financialInfo.submittalRangeType ?? 'temp';
    financialInfo.direct = financialInfo.direct ?? '1';
    financialInfo.exclusive = financialInfo.exclusive ?? '1';
    financialInfo.regularPayRate = financialInfo.regularPayRate ?? '25';

    if (aptFeature) {
      financialInfo.minimumPayRate = financialInfo.minimumPayRate ?? '20';
      financialInfo.maximumPayRate = financialInfo.maximumPayRate ?? '25';
    }

    await this.switchTab('financialInfo');

    for (const [key, value] of Object.entries(financialInfo)) {
      switch (key) {
        case 'regularPayRate':
          if (await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiRegularPayRate).isVisible()) {
            await this.setField('regularPayRate', value);
          }
          break;
        case 'submittalRangeType':
          if (await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiSubmittalRangeTypeTemp).isVisible()) {
            await this.setSubmittalRangeType(value);
          }
          break;
        case 'rateType':
          if (await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiRateType).isVisible()) {
            await this.setField('rateType', value);
          }
          break;
        case 'exclusive':
          await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiExclusive).selectOption({ value: String(value) });
          break;
        case 'direct':
          await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiDirect).selectOption({ value: String(value) });
          break;
        case 'maximumPayRate':
          if (aptFeature) await this.setField('maximumPayRate', value);
          break;
        case 'minimumPayRate':
          if (aptFeature) await this.setField('minimumPayRate', value);
          break;
        case 'minimumBillRate':
          if (aptFeature) await this.setField('minimumBillRate', value);
          break;
        case 'maximumBillRate':
          if (aptFeature) await this.setField('maximumBillRate', value);
          break;
        default:
          await this.typeFinancialValue(value, `fi${key.charAt(0).toUpperCase()}${key.slice(1)}`);
          break;
      }
    }

    await this.switchTab('summary');
  }

  // --- Auto fill ---

  async newOrderAutoFill() {
    await this.setStartDate(new Date());
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);
    await this.setEndDate(endDate);
    await this.addOrderCreditDefault();

    const summarySelects = [
      OrderDrawNewOrderFromClient.LOCATORS.summBillTo,
      OrderDrawNewOrderFromClient.LOCATORS.summOrderedBy,
      OrderDrawNewOrderFromClient.LOCATORS.summReportTo,
      OrderDrawNewOrderFromClient.LOCATORS.summOffSitePreference,
      OrderDrawNewOrderFromClient.LOCATORS.summReasonCreated,
      OrderDrawNewOrderFromClient.LOCATORS.summHowHeard,
    ];
    for (const sel of summarySelects) {
      const select = this.page.locator(sel);
      const firstOption = select.locator('option:not([value=""])').first();
      const value = await firstOption.getAttribute('value');
      await select.selectOption(value);
    }

    await this.switchTab('positionDescription');
    const time = String(Date.now());
    const titleField = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdPositionTitle);
    await titleField.clear();
    await titleField.fill(`auto Position Title ${time}`);
    const infoField = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdInternalOrderInfo);
    await infoField.clear();
    await infoField.fill(`auto Internal Order Info ${time}`);
    const notesField = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.pdNotesForTheOnboarder);
    await notesField.clear();
    await notesField.fill(`auto Notes For The Onboarder ${time}`);
    await this.setSegment();
    await this.setOrderIntakeStatusDropdown();

    await this.switchTab('financialInfo');
    await this.setMinimumPayRate();
    await this.setMaximumPayRate();
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiExclusive).selectOption({ value: '1' });
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiDirect).selectOption({ value: '1' });
    await this.typeFinancialValue(34, 'fiRegularPayRate');
  }

  // --- Labels ---

  async getPayRateLabel() {
    return this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiPayRateLabel).textContent();
  }

  async getBillRateLabel() {
    return this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiBillRateLabel).textContent();
  }

  // --- Arrow-based dropdown setters ---

  async setSalesManagerByArrow(name) {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summSalesManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setAssistedByArrow(name) {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summAssistedByArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setFulfillmentManagerByArrow(name) {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summFulfillmentManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setAccountManagerByArrow(name) {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summAccountManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  // --- Flexbox / Select2-based setters ---

  /**
   * @param {string} name
   * @param {string|number} id
   */
  async setSalesManager(name, id) {
    await this.setField('salesManager', name);
    const option = this.page.locator(OrderDrawNewOrderFromClient.SELECTORS.salesManagerId(id));
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * @param {string} name
   * @param {string|number} id
   */
  async setOrderAssistedBy(name, id) {
    await this.setField('orderAssistedBy', name);
    const option = this.page.locator(OrderDrawNewOrderFromClient.SELECTORS.orderAssistedById(id));
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  /**
   * @param {string} agentName
   * @param {string|number} agentPersonId
   */
  async setQccReviewerTo(agentName, agentPersonId) {
    const field = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.summQccReviewer);
    await field.clear();
    await this.setField('qccReviewer', agentName);
    await this.page.locator(OrderDrawNewOrderFromClient.SELECTORS.qccReviewerOption(agentPersonId)).click();
  }

  // --- Fill order ---

  findQuickFill() {
    return new FillOrder(this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fillOrderModal));
  }

  async saveAndFill() {
    const page = this.page;
    page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('quickFill');
    return this.findQuickFill();
  }

  // --- Collaborator ---

  /**
   * @param {string} name
   * @param {string|number} id
   */
  async addCollaborator(name, id) {
    const input = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fieldCollaboratorsInput);
    await input.clear();
    await input.fill(name);
    await this.page.locator(OrderDrawNewOrderFromClient.SELECTORS.collaboratorValue(String(id)))
      .waitFor({ state: 'visible' });
    await this.page.locator(OrderDrawNewOrderFromClient.SELECTORS.collaboratorValue(String(id))).click();
  }

  // --- Purchase order ---

  async setPurchaseOrderSelect2(content) {
    await this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiPurchaseOrderSelect2).click();

    const label = this.page.locator(OrderDrawNewOrderFromClient.LOCATORS.fiPurchaseOrderSelect2Label);
    const labelFor = await label.getAttribute('for');
    const select2Id = `${labelFor}_search`;
    const select2Index = select2Id.charAt(12);

    const input = this.page.locator(`#${select2Id}`);
    await input.clear();
    await input.fill(content);

    const result = this.page.locator(`#select2-results-${select2Index}`);
    await result.waitFor({ state: 'visible', timeout: 5000 });
    await result.click();
  }

  // --- Submit ---

  async submitSave() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('confirmSave');
  }

  async submitSaveAndPost() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('SavePost');
  }
}

module.exports = { OrderDrawNewOrderFromClient };
