const { LegacyActionScreen } = require('../legacy_action_screen');
const { FillOrder } = require('./fill_order_modal');
const { AddNewRatesModal } = require('./add_new_rates_modal');
const { OrderCommuteLocationModal } = require('./order_commute_location_modal');

/**
 * Page class that supports operations related to the Edit Order Detail page.
 */
class OrderEditDetail extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawEditOrderDetail';

  static TAB_IDS = {
    summary:             'summary',
    positionDescription: 'position_description',
    financialInfo:       'financial_info',
    customFields:        'custom_fields',
    attachments:         'attachments',
  };

  static SELECTORS = {
    creditAgentOption:  (id) => `div.creditsContainer div[val="${id}"]`,
    deleteCreditIndex:  (n) => `#orderCredits .orderCredit:nth-child(${n}) .controlImg[title="Delete credit"]`,
    collaboratorValue:  (id) => `.selectize-dropdown-content > div[data-value="${id}"]`,
  };

  static LOCATORS = {
    meetingSummaryIframe:       '//div[@id="cke_order-intake-transcript-summary"]//iframe',
    workLocationEditLink:      '#work-location-edit-link',
    commuteLocationEditLink:   '#commute-location-edit-link',
    commuteLocationModal:      '#edit-commute-location-modal',
    fillOrderModal:            '#fill-order-modal',
    numViableCandidates:       '#numViableCandidates',
    orderInvoicePoModal:       '#invoice-po-modal',
    purchaseOrderAddNewButton: '#link_newPO',
    addNewRatesModal:          '#orderRatesModal',
    poModal:                   '#poModal',
    snackbar:                  '#snackbar',
    swal2Confirm:              '.swal2-confirm',
    swal2Cancel:               '.swal2-cancel',
    jobTrackerWidgetRow:       '.jobTrackerWidget',

    // Summary tab
    summOrderId:               '#orderId',
    summStartDate:             '#startDate',
    summEndDate:               '#endDate',
    summEndDateStatus:         '#orderEndDateStatusId',
    summEndReason:             '#orderEndReasonId',
    summCreditHoldMessage:     '//td[contains(text(), "Client on credit hold")]',
    summBillTo:                '#billTo',
    summOrderedBy:             '#orderedBy',
    summReportTo:              '#reportTo',
    summQccReviewerArrow:      '#qccReviewerId_arrow',
    summQccReviewerDropdown:   '#qccReviewerId_ctr',
    summCollaboratorsInput:    '#collaborators-select-selectized',
    summSpecificDirections:    '[name="specificDirections"]',
    summOnboardingComplete:    '[name="onboardingComplete"]',
    summUsCanOnboardingComplete: '[name="usCanOnboardingComplete"]',
    summRightColumn:           '//*[@id="TabPage"]/table/tbody/tr/td[2]/table',
    summDivision:              '#divisionList',
    summOffSitePreference:     '#offSitePreferenceId',
    summPlacementType:         '#placementTypeList',
    summUseLroCheckbox:        '#useLro',
    summImportance:            '#orderImportance',
    summPriority:              '#priority',
    summMaxCandidates:         '#maxCandidates',
    summAccountManagerInput:   '#accountManagerId_input',
    summAccountManagerArrow:   '#accountManagerId_arrow',
    summAccountManagerDropdown:'#accountManagerId_ctr',
    summAssistedByInput:       '#assistedById_input',
    summAssistedByArrow:       '#assistedById_arrow',
    summAssistedByDropdown:    '#assistedById_ctr',
    summSalesManagerInput:     '#salesManagerId_input',
    summSalesManagerArrow:     '#salesManagerId_arrow',
    summSalesManagerDropdown:  '#salesManagerId_ctr',
    summFulfillmentManagerInput:   '#fulfillmentManagerId_input',
    summFulfillmentManagerArrow:   '#fulfillmentManagerId_arrow',
    summFulfillmentManagerDropdown:'#fulfillmentManagerId_ctr',
    summSourcerInput:          '#sourcedById_input',
    summSourcerArrow:          '#sourcedById_arrow',
    summSourcerDropdown:       '#sourcedById_dropdown',
    summWorkLocationType:      '#work-location-type-display',
    summHowHeard:              '#howHeard',
    summCreditAgentNameField:  '#newAgentId_input',
    summCreditPercentageField: '#newPercentage',
    summCreditAddButton:       '#add-new-credit-icon',
    summCreditControls:        '.controls',
    summCreditReadOnlyMessage: 'img[title^="You do not have permission to edit filled orders that have a timecard"]',
    summCreditDeleteButton:    'img[title="Cancel changes"]',
    summDisableMatTimecard:    '#hideTimecards',
    summCreateDate:            '#create-date',
    summOrderEndDateStatus:    '#orderEndDateStatusId',
    summOrderEndReason:        '#orderEndReasonId',
    summDisableAutomatedCheckin: '#disableAutomatedCheckin',
    summPaidByUmbrellaCompany: '#paidByUmbrellaCompany',
    summIsIr35:                '#is_ir35',
    summIr35Satisfied:         '#is_ir35_satisfied',
    summIcName:                '#ICName',
    summPayrollTransfer:       '#payrollTransfer',
    summAquentEquipmentLoaned: '#equipmentLoaned',
    summRemoteDuringPandemic:  '#remoteDuringPandemic',
    summPandemicReturnPlan:    '#pandemicReturnPlan',
    summDisableTimecardEntryMat: '#hideTimecardsDisabled',
    summScoutPlacementId:      '[name="scoutPlacementId"]',
    summScoutPositionId:       '[name="scoutPositionId"]',
    summUsesDtr:               '#dtr',
    summCommuteLocationTypeDisplay: '#commute-location-type-display',
    summCommuteLocationAddress: '#commute-location-addr-display',
    summMinorSegment:          '#minorSegment',

    // Financial info tab
    fiHoursPerWeek:            '#hoursPerWeek',
    fiOtExemptionDescription:  '#qualifiesForOvertimeExemption',
    fiOtBeingPaidDescription:  '#isOvertimeBeingPaid',
    fiPayTypeIc:               'input[name="employeeType"][value="1"]',
    fiPayTypeW2:               'input[name="employeeType"][value="2"]',
    fiDailyPayRate:            '#dailyPayRate',
    fiOvertimePayRate:         '[name="OTPayRate"]',
    fiDoubleTimePayRate:       '[name="doubletimePayRate"]',
    fiRegularBillRate:         '#regularBillRate',
    fiOvertimeBillRate:        '[name="OTBillRate"]',
    fiDoubleTimeBillRate:      '[name="doubletimeBillRate"]',
    fiOtRatio:                 '#OTRatio',
    fiMinimumSalary:           '#salaryMinimum',
    fiMaximumSalary:           '#salaryMaximum',
    fiMinimumPayRate:          '#minPayInput',
    fiMaximumPayRate:          '#maxPayInput',
    fiMinimumBillRate:         '#minBillRateInput',
    fiMaximumBillRate:         '#maxBillRate',
    fiSubmittalRangeTypeTemp:  '#submittal-range-type-temp',
    fiSubmittalRangeTypePerm:  '#submittal-range-type-perm',
    fiPermPercent:             '[name="permPercent"]',
    fiThresholdType:           '#ThresholdType',
    fiPayTalentOvertimeYes:    '#payTalentOvertimeYesClick',
    fiPayTalentOvertimeNo:     '#payTalentOvertimeNoClick',
    fiBillClientOvertimeYes:   '#billClientForOvertimeYesClick',
    fiBillClientOvertimeNo:    '#billClientForOvertimeNoClick',
    fiDailyOtThreshold:        '[name="dailyOvertimeThreshold"]',
    fiDailyDtThreshold:        '[name="dailyDoubletimeThreshold"]',
    fiSaturdayOtThreshold:     '[name="satOvertimeThreshold"]',
    fiSaturdayDtThreshold:     '[name="satDoubletimeThreshold"]',
    fiSundayOtThreshold:       '[name="sunOvertimeThreshold"]',
    fiSundayDtThreshold:       '[name="sunDoubletimeThreshold"]',
    fiWeeklyOtThreshold:       '[name="weeklyOvertimeThreshold"]',
    fiWeeklyDtThreshold:       '[name="weeklyDoubletimeThreshold"]',
    fiRateTypeHourly:          'input[name="rateType"][value="1"]',
    fiRateTypeDaily:           'input[name="rateType"][value="2"]',
    fiAddNewRates:             '#addRateButton',
    fiWeekEndDaySelect:        '#weekEndDay',
    fiSaveNewRates:            '#saveButtonOrderRates',
    fiAmountBilled:            '[name="amountBilled"]',
    fiAmountPaid:              '[name="amountPaid"]',
    fiProjectMarkup:           '[name="projectMarkup"]',
    fiHourlyMarkupValue:       '#hourlyMarkupNode',
    fiRegularPayRate:          '#regularPayRate',
    fiExclusive:               '#exclusiveOrderStatus',
    fiDirect:                  '#directOrderStatus',
    fiPercentToFillOverride:   '#overridePercentToFill',
    fiPercentToFill:           '#percentToFillInputDisplay',
    fiRecalculateButton:       '#recalculateGPButton',
    fiPotentialGp:             '#potential-gp',
    fiHiddenPotentialGp:       '#estimated-gp',
    fiDiscount:                '#discountPercentage',

    // Position description tab
    pdPositionTitle:           '[name="title"]',
    pdInternalOrderInfo:       'textarea[name="internalOrderInfo"]',
    pdNotesForTheOnboarder:    '#notesForTheOnboarder',
    pdSubmittalDetails:        '#submittalDetails',
    pdEditDetails:             '#editDetails',
    pdAddDetails:              '#addDetails',
    pdSubmittalReqModal:       '#submittalReqModal',
    pdSubmittalReqTextarea:    '#submittalReq',
    pdSubmittalReqModalSave:   '#saveSubmittalReq',
    pdShowMore:                "//*[contains(text(),'Show More')]",
    pdSubmittalDetailsModBy:   '#submittal-details-mod-by',
    pdJobDescription:          '#jobDescription',
    pdMyAquentIdentifier:      '[name="myAquentIdentifier"]',
    pdMeetingNotes:            '#orderIntakeMeetingNotes',
    pdMeetingTranscriptFilename:   '#order-intake-transcript-attachment-to-be-saved',
    pdMeetingTranscriptFileInput:  '#order-intake-local-computer-transcript-picker',
    pdMeetingSummaryIframeBody:    '//body',
    pdMeetingSummary:          '#order-intake-transcript-summary',
    pdMeetingTranscriptDeleteButton: '#delete-attachment',
    pdOrderIntakeStatusDropdown: '#orderIntakeStatus',
    pdSelectFromMyComputerButton: '#order-intake-local-computer-transcript',
    pdEmptyMeetingSummaryContainer: '#empty-order-intake-transcript-summary-container',
    pdMinorSegment:            '#minorSegment',
    pdMinorSegmentSelect2:     '#s2id_minorSegment',

    // Custom fields tab
    cfCustomFieldRow:          "*//div[@pageid='custom_fields']/table/tbody/tr",
    cfCustomFieldRowTitle:     'td:nth-child(1)',
    cfCustomFieldRowInput:     'td:nth-child(2) *',

    // Diversity
    divHasDiversityCheckbox:   '#hasDiversityCheckbox',
    divDiversityOptions:       '#diversityOptions',
    divGenderFemale:           '#genderCheckboxFemale',
    divGenderMale:             '#genderCheckboxMale',
    divGenderNonBinary:        '#genderCheckboxNonBinary',
    divLgbtq:                  '#lgbtqCheckbox',
    divEthnicityWhite:         '#ethnicityWhite',
    divEthnicityBlackAfricanAmerican: '#ethnicityBlackAfricanAmerican',
    divEthnicityHispanicLatino: '#ethnicityHispanicLatino',
    divEthnicityAsian:         '#ethnicityAsian',
    divEthnicityAmericanIndianAlaskanNative: '#ethnicityAmericanIndianAlaskanNative',
    divEthnicityNativeHawaiianPacIslander: '#ethnicityNativeHawaiianPacIslander',
    divEthnicityTwoRaces:      '#ethnicityTwoRaces',
    divVeteran:                '#veteranCheckbox',
    divDisability:             '#disabilityCheckbox',
    divNeurodiverse:           '#neurodiverseCheckbox',

    // Attachments tab
    attRows:                   'table[id="attachments-table"] > tbody > tr',
    attLastCheckbox:           'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(1) > input',
    attLastLink:               'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(2) > a',
    attLastCandidateName:      'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(3)',
    attLastActive:             'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(4)',
    attLastType:               'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(5)',
    attLastDescription:        'table[id="attachments-table"] > tbody > tr:last-child > td:nth-child(6)',

    // Job tracker widget
    jtFrame:                   '#jobTrackerWidgetFrame',
    jtChipSet:                 '.job-tracker-chip',
    jtChipRunning:             '.chip-running',
    jtChipSuccess:             '.chip-success',
    jtChipFailed:              '.chip-failure',

    // Fields (used by setField / getField framework)
    fieldOrderPriority:        '#priority',
    fieldMaxCandidates:        '#maxCandidates',
    fieldSegments:             '#minorSegment',
    fieldPlacementType:        '#placementTypeList',
    fieldImportance:           '#orderImportance',
    fieldBillTo:               '#billTo',
    fieldOnboardingComplete:   '[name="onboardingComplete"]',
    fieldUsCanOnboardingComplete: '[name="usCanOnboardingComplete"]',
    fieldDirectHireFee:        '[name="permFee"]',
    fieldPermPercent:          '[name="permPercent"]',
    fieldHowHeard:             '#howHeard',
    fieldPermFinalSalary:      '[name="permFinalSalary"]',
    fieldStartDate:            '#startDate',
    fieldEndDate:              '#endDate',
    fieldEndDateStatus:        '#orderEndDateStatusId',
    fieldEndReason:            '#orderEndReasonId',
    fieldNumberOfOpenings:     '#numberOfOpenings',
    fieldStatus:               '#orderStatus',
    fieldPositionTitle:        '[name="title"]',
    fieldMatJobTitle:          '[name="friendlyTitle"]',
    fieldRegularPayRate:       '#regularPayRate',
    fieldHourlyMarkupValue:    '#hourlyMarkupNode',
    fieldThresholdType:        '#ThresholdType',
    fieldAgreementAccepted:    '[name="contractAccepted"]',
    fieldDailyOtThreshold:     '[name="dailyOvertimeThreshold"]',
    fieldDailyDtThreshold:     '[name="dailyDoubletimeThreshold"]',
    fieldSaturdayOtThreshold:  '[name="satOvertimeThreshold"]',
    fieldSaturdayDtThreshold:  '[name="satDoubletimeThreshold"]',
    fieldSundayOtThreshold:    '[name="sunOvertimeThreshold"]',
    fieldSundayDtThreshold:    '[name="sunDoubletimeThreshold"]',
    fieldWeeklyOtThreshold:    '[name="weeklyOvertimeThreshold"]',
    fieldWeeklyDtThreshold:    '[name="weeklyDoubletimeThreshold"]',
    fieldPayTalentOvertimeYes: '#payTalentOvertimeYesClick',
    fieldPayTalentOvertimeNo:  '#payTalentOvertimeNoClick',
    fieldBillClientOvertimeYes:'#billClientForOvertimeYesClick',
    fieldBillClientOvertimeNo: '#billClientForOvertimeNoClick',
    fieldPayrollTransfer:      '#payrollTransfer',
    fieldScoutPlacementId:     '[name="scoutPlacementId"]',
    fieldExclusive:            '#exclusiveOrderStatus',
    fieldDirect:               '#directOrderStatus',
    fieldDiscount:             '[name="discount"]',
    fieldMaximumSalary:        '#salaryMaximum',
    fieldMinimumSalary:        '#salaryMinimum',
    fieldPercentToFill:        '#percentToFillInputDisplay',
    fieldMinimumPayRate:       '#minPayInput',
    fieldMaximumPayRate:       '#maxPayInput',
    fieldMinimumBillRate:      '#minBillRateInput',
    fieldMaximumBillRate:      '#maxBillRate',
    fieldOrderIntakeStatusDropdown: '#orderIntakeStatus',
  };

  static FIELDS = {
    orderPriority:           { tab: 'summary', type: 'select' },
    maxCandidates:           { tab: 'summary', type: 'select' },
    placementType:           { tab: 'summary', type: 'select' },
    importance:              { tab: 'summary', type: 'select' },
    billTo:                  { tab: 'summary', type: 'select' },
    onboardingComplete:      { tab: 'summary', type: 'checkbox' },
    usCanOnboardingComplete: { tab: 'summary', type: 'checkbox' },
    howHeard:                { tab: 'summary', type: 'select' },
    directHireFee:           { tab: 'financialInfo', type: 'text' },
    permPercent:             { tab: 'financialInfo', type: 'text' },
    permFinalSalary:         { tab: 'financialInfo', type: 'text' },
    maximumSalary:           { tab: 'financialInfo', type: 'text' },
    minimumSalary:           { tab: 'financialInfo', type: 'text' },
    minimumPayRate:          { tab: 'financialInfo', type: 'text' },
    maximumPayRate:          { tab: 'financialInfo', type: 'text' },
    minimumBillRate:         { tab: 'financialInfo', type: 'text' },
    maximumBillRate:         { tab: 'financialInfo', type: 'text' },
    submittalRangeTypeTemp:  { tab: 'financialInfo', type: 'radio' },
    submittalRangeTypePerm:  { tab: 'financialInfo', type: 'radio' },
    segments:                { tab: 'positionDescription', type: 'select' },
    orderIntakeStatusDropdown: { tab: 'positionDescription', type: 'select' },
    startDate:               { tab: 'summary', type: 'text' },
    endDate:                 { tab: 'summary', type: 'text' },
    endDateStatus:           { tab: 'summary', type: 'select' },
    endReason:               { tab: 'summary', type: 'select' },
    numberOfOpenings:        { type: 'text' },
    status:                  { type: 'select' },
    positionTitle:           { tab: 'positionDescription', type: 'text' },
    matJobTitle:             { tab: 'positionDescription', type: 'text' },
    regularPayRate:          { tab: 'financialInfo', type: 'text' },
    hourlyMarkupValue:       { tab: 'financialInfo', type: 'text' },
    thresholdType:           { tab: 'financialInfo', type: 'select' },
    agreementAccepted:       { tab: 'summary', type: 'checkbox' },
    dailyOtThreshold:        { tab: 'financialInfo', type: 'text' },
    dailyDtThreshold:        { tab: 'financialInfo', type: 'text' },
    saturdayOtThreshold:     { tab: 'financialInfo', type: 'text' },
    saturdayDtThreshold:     { tab: 'financialInfo', type: 'text' },
    sundayOtThreshold:       { tab: 'financialInfo', type: 'text' },
    sundayDtThreshold:       { tab: 'financialInfo', type: 'text' },
    weeklyOtThreshold:       { tab: 'financialInfo', type: 'text' },
    weeklyDtThreshold:       { tab: 'financialInfo', type: 'text' },
    payrollTransfer:         { tab: 'summary', type: 'checkbox' },
    aquentEquipmentLoaned:   { tab: 'summary', type: 'checkbox' },
    payTalentOvertimeYes:    { tab: 'financialInfo', type: 'radio' },
    payTalentOvertimeNo:     { tab: 'financialInfo', type: 'radio' },
    billClientOvertimeYes:   { tab: 'financialInfo', type: 'radio' },
    billClientOvertimeNo:    { tab: 'financialInfo', type: 'radio' },
    scoutPlacementId:        { tab: 'summary', type: 'text' },
    direct:                  { tab: 'financialInfo', type: 'select' },
    exclusive:               { tab: 'financialInfo', type: 'select' },
    discount:                { tab: 'financialInfo', type: 'text' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawEditOrderDetail',
  ];

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  /** @private */
  _formatDate(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}/${d}/${date.getFullYear()}`;
  }

  // --- Order intake status ---

  /**
   * @param {string|null} [orderIntakeStatus='1']
   */
  async setOrderIntakeStatusDropdown(orderIntakeStatus = '1') {
    if (await this.readFeature('order-intake-status')) {
      await this.switchTab('positionDescription');
      await this.page.locator(OrderEditDetail.LOCATORS.pdOrderIntakeStatusDropdown)
        .selectOption({ value: orderIntakeStatus });
    }
  }

  // --- Pay rate fields ---

  /**
   * @param {number|string} [minPay=20]
   * @param {boolean} [overrideExistingRate=false]
   */
  async setMinimumPayRate(minPay = 20, overrideExistingRate = false) {
    if (await this.readFeature('applicant-pay-transparency')) {
      await this.switchTab('financialInfo');
      const field = this.page.locator(OrderEditDetail.LOCATORS.fiMinimumPayRate);
      const currentValue = parseFloat((await field.inputValue()).replace(/[^\d.]/g, '') || '0');
      if (currentValue <= 0 || overrideExistingRate) {
        await this.setField('minimumPayRate', minPay);
      }
    }
  }

  /**
   * @param {number|string} [maxPay=25]
   * @param {boolean} [overrideExistingRate=false]
   */
  async setMaximumPayRate(maxPay = 25, overrideExistingRate = false) {
    if (await this.readFeature('applicant-pay-transparency')) {
      await this.switchTab('financialInfo');
      const field = this.page.locator(OrderEditDetail.LOCATORS.fiMaximumPayRate);
      const currentValue = parseFloat((await field.inputValue()).replace(/[^\d.]/g, '') || '0');
      if (currentValue <= 0 || overrideExistingRate) {
        await this.setField('maximumPayRate', maxPay);
      }
    }
  }

  /**
   * @param {number|string} [minBillRate=30]
   */
  async setMinimumBillRate(minBillRate = 30) {
    await this.switchTab('financialInfo');
    await this.setField('minimumBillRate', minBillRate);
  }

  /**
   * @param {number|string} [maxBillRate=35]
   */
  async setMaximumBillRate(maxBillRate = 35) {
    await this.switchTab('financialInfo');
    await this.setField('maximumBillRate', maxBillRate);
  }

  /**
   * Sets all rate fields. Accepts four individual args, an array of four, or an object with rate keys.
   *
   * @param  {...any} args
   */
  async setAllRates(...args) {
    let minPayRate, maxPayRate, minBillRate, maxBillRate;

    if (args.length === 1) {
      const input = args[0];
      if (Array.isArray(input) && input.length === 4) {
        [minPayRate, maxPayRate, minBillRate, maxBillRate] = input;
      } else if (typeof input === 'object') {
        minPayRate = input.minimumPayRate;
        maxPayRate = input.maximumPayRate;
        minBillRate = input.minimumBillRate;
        maxBillRate = input.maximumBillRate;
      } else {
        throw new Error('Invalid input: must be array of 4 or object with 4 keys');
      }
    } else if (args.length === 4) {
      [minPayRate, maxPayRate, minBillRate, maxBillRate] = args;
    } else {
      throw new Error('Provide 4 rates as args, array, or object');
    }

    await this.setMinimumPayRate(minPayRate, true);
    await this.setMaximumPayRate(maxPayRate, true);
    await this.setMinimumBillRate(minBillRate);
    await this.setMaximumBillRate(maxBillRate);
  }

  /**
   * @param {string} [rangeType='temp']
   */
  async setSubmittalRangeType(rangeType = 'temp') {
    await this.switchTab('financialInfo');
    const tempButton = this.page.locator(OrderEditDetail.LOCATORS.fiSubmittalRangeTypeTemp);
    if (await tempButton.isVisible()) {
      if (rangeType.toLowerCase() === 'perm') {
        await this.page.locator(OrderEditDetail.LOCATORS.fiSubmittalRangeTypePerm).click();
      } else {
        await tempButton.click();
      }
    }
  }

  // --- Getters ---

  async getOrderPriorityText() {
    const select = this.page.locator(OrderEditDetail.LOCATORS.fieldOrderPriority);
    const selectedValue = await select.inputValue();
    return select.locator(`option[value="${selectedValue}"]`).textContent();
  }

  async getOrderId() {
    return this.page.locator(OrderEditDetail.LOCATORS.summOrderId).inputValue();
  }

  async getNumViableCandidates() {
    return this.page.locator(OrderEditDetail.LOCATORS.numViableCandidates).inputValue();
  }

  // --- Diversity ---

  async clickAllDiversityCheckboxes() {
    const diversityLocators = [
      'divGenderFemale', 'divGenderMale', 'divGenderNonBinary', 'divLgbtq',
      'divEthnicityWhite', 'divEthnicityBlackAfricanAmerican', 'divEthnicityHispanicLatino',
      'divEthnicityAsian', 'divEthnicityAmericanIndianAlaskanNative',
      'divEthnicityNativeHawaiianPacIslander', 'divEthnicityTwoRaces',
      'divVeteran', 'divDisability', 'divNeurodiverse',
    ];
    for (const key of diversityLocators) {
      await this.page.locator(OrderEditDetail.LOCATORS[key]).click();
    }
  }

  // --- Modals ---

  async openEditCommuteLocation() {
    await this.page.locator(OrderEditDetail.LOCATORS.commuteLocationEditLink).click();
    const modal = new OrderCommuteLocationModal(this.page.locator(OrderEditDetail.LOCATORS.commuteLocationModal));
    await modal.waitForLoad();
    return modal;
  }

  async openEditWorkLocation() {
    await this.page.locator(OrderEditDetail.LOCATORS.workLocationEditLink).click();
    return new FillOrder(this.page.locator(OrderEditDetail.LOCATORS.fillOrderModal));
  }

  async openRateAdjustment() {
    await this.page.locator(OrderEditDetail.LOCATORS.fiAddNewRates).click();
    return new AddNewRatesModal(this.page.locator(OrderEditDetail.LOCATORS.addNewRatesModal));
  }

  async openEditWorkLocationAfterAddressChangeSave() {
    await this.page.locator(OrderEditDetail.LOCATORS.workLocationEditLink).click();
  }

  findQuickFill() {
    return new FillOrder(this.page.locator(OrderEditDetail.LOCATORS.fillOrderModal));
  }

  /**
   * Opens the rate modal for a specific start date (yyyy-mm-dd format).
   *
   * @param {string} startDate
   * @returns {AddNewRatesModal}
   */
  async editRatesByStartDate(startDate) {
    await this.page.locator(`//table[@id='rateBlurbsTable']//*[@data-start-date='${startDate}']//a`).click();
    return new AddNewRatesModal(this.page.locator(OrderEditDetail.LOCATORS.addNewRatesModal));
  }

  // --- Date fields ---

  /**
   * @param {Date} startDate
   */
  async setStartDate(startDate) {
    const field = this.page.locator(OrderEditDetail.LOCATORS.summStartDate);
    await field.clear();
    await field.fill(this._formatDate(startDate));
  }

  /**
   * @param {Date} endDate
   */
  async setEndDate(endDate) {
    const field = this.page.locator(OrderEditDetail.LOCATORS.summEndDate);
    await field.clear();
    await field.fill(this._formatDate(endDate));
  }

  async setEndDateStatus(endDateStatusId) {
    await this.setField('endDateStatus', endDateStatusId);
  }

  async setOrderEndReason(orderEndReasonId) {
    await this.setField('endReason', orderEndReasonId);
  }

  // --- Checkboxes ---

  async setUseLro() {
    await this.switchTab('summary');
    const checkbox = this.page.locator(OrderEditDetail.LOCATORS.summUseLroCheckbox);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  async setOrderStatus(status) {
    await this.setField('status', status);
  }

  async setHowHeard(howHeard) {
    await this.page.locator(OrderEditDetail.LOCATORS.summHowHeard).selectOption(howHeard);
  }

  // --- Save / Cancel ---

  /**
   * Clicks Save and dismisses any alert. Returns true if no alert, false otherwise.
   *
   * @returns {Promise<boolean>}
   */
  async submitSave() {
    let alertText = null;
    const handler = (dialog) => {
      alertText = dialog.message();
      dialog.dismiss();
    };
    this.page.once('dialog', handler);
    await this.clickAsaba('Save');
    await this.page.waitForTimeout(500);
    if (alertText) {
      console.error(`Alert encountered while attempting to save: ${alertText}`);
    }
    return !alertText;
  }

  async saveAcceptAlert() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('Save');
  }

  async submitCancel() {
    await this.clickAsaba('Cancel');
  }

  async submitCancelWrkLocValidate() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
    await this.clickAsaba('Cancel');
  }

  // --- Order credit ---

  /**
   * @param {string} agentName
   * @param {string|number} agentPersonId
   * @param {number|string} percentage
   */
  async addOrderCredit(agentName, agentPersonId, percentage) {
    const nameField = this.page.locator(OrderEditDetail.LOCATORS.summCreditAgentNameField);
    const optionSelector = OrderEditDetail.SELECTORS.creditAgentOption(agentPersonId);

    // Retry typing until the option appears
    await nameField.clear();
    await nameField.fill(String(agentName));
    await this.page.locator(optionSelector).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(optionSelector).click();

    const pctField = this.page.locator(OrderEditDetail.LOCATORS.summCreditPercentageField);
    await pctField.fill(String(percentage));
    await this.page.locator(OrderEditDetail.LOCATORS.summCreditAddButton).click();
  }

  async addOrderCreditDefault() {
    await this.addOrderCredit('Automation, Test', 1773265, '100');
  }

  /**
   * @param {number} index - 1-based index
   */
  async deleteCredit(index) {
    await this.page.locator(OrderEditDetail.SELECTORS.deleteCreditIndex(index)).click();
  }

  // --- Onboarding ---

  /**
   * @param {boolean} value
   */
  async setOnboardingComplete(value) {
    await this.switchTab('summary');
    const intlCheckbox = this.page.locator(OrderEditDetail.LOCATORS.summOnboardingComplete);
    const usCanCheckbox = this.page.locator(OrderEditDetail.LOCATORS.summUsCanOnboardingComplete);

    if (await intlCheckbox.count() > 0) {
      await intlCheckbox.first().setChecked(value);
    } else if (await usCanCheckbox.count() > 0) {
      await usCanCheckbox.first().setChecked(value);
    }
  }

  /**
   * @param {string|null} textInput
   */
  async setOnboardingNotes(textInput = null) {
    await this.switchTab('positionDescription');
    textInput = textInput || `default onboarding note ${Date.now()}`;
    await this.page.locator(OrderEditDetail.LOCATORS.pdNotesForTheOnboarder).fill(textInput);
  }

  async setOnboardingNotesToNull() {
    await this.switchTab('positionDescription');
    await this.page.locator(OrderEditDetail.LOCATORS.pdNotesForTheOnboarder).clear();
  }

  // --- Arrow-based dropdown setters ---

  async setAccountManagerByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summAccountManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setSalesManagerByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summSalesManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setAssistedByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summAssistedByArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setFulfillmentManagerByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summFulfillmentManagerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setSourcerByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summSourcerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  async setQccReviewerByArrow(name) {
    await this.page.locator(OrderEditDetail.LOCATORS.summQccReviewerArrow).click();
    await this.page.locator(`//*[@id='${name}']`).click();
  }

  // --- Collaborator ---

  /**
   * @param {string} name
   * @param {string|number} id
   */
  async addCollaborator(name, id) {
    const input = this.page.locator(OrderEditDetail.LOCATORS.summCollaboratorsInput);
    await input.clear();
    await input.fill(name);
    const option = this.page.locator(OrderEditDetail.SELECTORS.collaboratorValue(String(id)));
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  // --- Overtime radio buttons ---

  async choosePayTalentOvertimeYes() {
    const el = this.page.locator(OrderEditDetail.LOCATORS.fieldPayTalentOvertimeYes);
    if (!(await el.isChecked())) await el.click();
  }

  async choosePayTalentOvertimeNo() {
    const el = this.page.locator(OrderEditDetail.LOCATORS.fieldPayTalentOvertimeNo);
    if (!(await el.isChecked())) await el.click();
  }

  async chooseBillClientOvertimeYes() {
    const el = this.page.locator(OrderEditDetail.LOCATORS.fieldBillClientOvertimeYes);
    if (!(await el.isChecked())) await el.click();
  }

  async chooseBillClientOvertimeNo() {
    const el = this.page.locator(OrderEditDetail.LOCATORS.fieldBillClientOvertimeNo);
    if (!(await el.isChecked())) await el.click();
  }

  // --- Financial value helper ---

  /**
   * @param {string|number} value
   * @param {string} locatorKey
   */
  async typeFinancialValue(value, locatorKey) {
    await this.switchTab('financialInfo');
    const field = this.page.locator(OrderEditDetail.LOCATORS[locatorKey]);
    await field.click();
    await field.clear();
    await field.fill(String(value));
    await field.press('Enter');
    await field.press('Tab');
  }

  /**
   * Checks if the order is locked.
   *
   * @returns {Promise<boolean>}
   */
  async isLocked() {
    return this.page.locator('[pageid=locked]').isVisible();
  }

  // --- Custom fields ---

  /**
   * @param {string} customField - Custom field title text
   * @param {string} answer
   */
  async answerCustomField(customField, answer) {
    await this.switchTab('customFields');
    const rows = this.page.locator(OrderEditDetail.LOCATORS.cfCustomFieldRow);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const title = (await row.locator(OrderEditDetail.LOCATORS.cfCustomFieldRowTitle).textContent()).trim();
      if (title.toLowerCase() === customField.toLowerCase()) {
        const input = row.locator(OrderEditDetail.LOCATORS.cfCustomFieldRowInput);
        await input.clear();
        await input.fill(answer);
        break;
      }
    }
  }

  // --- Rate adjustment helpers ---

  /**
   * Adds a new pay rate and returns an array of the resulting rate values.
   *
   * @param {number} newPayRate
   * @param {number} weeksOutStart
   * @param {number} markUp
   * @param {boolean} otExempt
   * @param {boolean} billClient
   * @returns {Promise<Array>}
   */
  async addNewPayRate(newPayRate, weeksOutStart, markUp, otExempt, billClient) {
    const modal = await this.openRateAdjustment();
    await modal.enterRate('markUp', markUp);
    await modal.enterRate('regularPayRate', newPayRate);
    await modal.payTalentOvertime(otExempt);
    await modal.billClientOvertime(billClient);
    await modal.setEffectiveDateByWeeksOut(weeksOutStart);

    const sweetAlertBtn = this.page.locator('.swal2-confirm');
    if (await sweetAlertBtn.isVisible()) {
      await sweetAlertBtn.click();
    }

    const outputs = [];
    outputs.push(await this.page.locator(AddNewRatesModal.LOCATORS.effectiveStartDateInput).inputValue());
    outputs.push(parseFloat(newPayRate));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.otPayRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.doublePayRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.regularBillRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.otBillRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.doubleBillRate).inputValue()));
    outputs.push(parseFloat(markUp));

    await modal.save();
    return outputs;
  }

  /**
   * Adds new pay and bill rates and returns an array of the resulting rate values.
   *
   * @param {number} newPayRate
   * @param {number} newBillRate
   * @param {number} otRatio
   * @param {number} weeksOutStart
   * @param {number} markUp
   * @param {boolean} otExempt
   * @param {boolean} billClient
   * @returns {Promise<Array>}
   */
  async addNewPayAndBillRate(newPayRate, newBillRate, otRatio, weeksOutStart, markUp, otExempt, billClient) {
    const modal = await this.openRateAdjustment();
    await modal.enterRate('otRatio', otRatio);
    await modal.enterRate('markUp', markUp);
    await modal.enterRate('regularPayRate', newPayRate);
    await modal.enterRate('regularBillRate', newBillRate);
    await modal.payTalentOvertime(otExempt);
    await modal.billClientOvertime(billClient);
    await modal.setEffectiveDateByWeeksOut(weeksOutStart);

    const sweetAlertBtn = this.page.locator('.swal2-confirm');
    if (await sweetAlertBtn.isVisible()) {
      await sweetAlertBtn.click();
    }

    const outputs = [];
    outputs.push(await this.page.locator(AddNewRatesModal.LOCATORS.effectiveStartDateInput).inputValue());
    outputs.push(parseFloat(newPayRate));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.otPayRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.doublePayRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.regularBillRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.otBillRate).inputValue()));
    outputs.push(parseFloat(await this.page.locator(AddNewRatesModal.LOCATORS.doubleBillRate).inputValue()));
    outputs.push(parseFloat(markUp));

    await modal.save();
    return outputs;
  }

  // --- Position description ---

  /**
   * @param {string} text
   */
  async setJobDescription(text) {
    await this.switchTab('positionDescription');
    const field = this.page.locator(OrderEditDetail.LOCATORS.pdJobDescription);
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {string} text
   */
  async setMeetingNotes(text) {
    const field = this.page.locator(OrderEditDetail.LOCATORS.pdMeetingNotes);
    await field.clear();
    await field.fill(text);
  }

  /**
   * Uploads a transcript file.
   *
   * @param {string} filePath
   */
  async setMeetingTranscript(filePath) {
    await this.page.locator(OrderEditDetail.LOCATORS.pdMeetingTranscriptFileInput).setInputFiles(filePath);
    await this.page.locator(`${OrderEditDetail.LOCATORS.pdMeetingSummary}.transcript-summary-filled`)
      .waitFor({ state: 'visible' });
  }

  async deleteMeetingTranscript() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.locator(OrderEditDetail.LOCATORS.pdMeetingTranscriptDeleteButton).click();
  }

  async clickManageCandidates() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('AWUIDrawManageCandidates');
  }

  /**
   * Gets the transcription summary text from the CKEditor iframe.
   *
   * @returns {Promise<string>}
   */
  async getTranscriptionSummary() {
    const iframe = this.page.frameLocator(OrderEditDetail.LOCATORS.meetingSummaryIframe);
    return iframe.locator('body').textContent();
  }

  /**
   * Appends text to the transcription summary in the CKEditor iframe.
   *
   * @param {string} text
   */
  async editTranscriptionSummary(text) {
    const iframe = this.page.frameLocator(OrderEditDetail.LOCATORS.meetingSummaryIframe);
    const body = iframe.locator('body');
    await body.click();
    await body.type(text);
  }
}

module.exports = { OrderEditDetail };
