const { LegacyActionScreen } = require('../legacy_action_screen');
const { DuplicateOrderDialog } = require('./duplicate_order_dialog');
const { FillOrder } = require('./fill_order_modal');
const { QCCModal } = require('./qcc_modal');
const { AchievementSnapshotInviteModal } = require('./achievement_snapshot_invite_modal');
const { OrderRatesViewModal } = require('./order_rates_view_modal');

/**
 * Page class that supports operations related to the Order View Detail page.
 */
class OrderViewDetail extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawViewOrderDetail';
  static OPEN_PATH = '/open/order/%d';

  static TAB_IDS = {
    summary:             'summary',
    positionDescription: 'position_description',
    financialInfo:       'financial_info',
    activityHistory:     'activity_history',
    qccHistory:          'qcc_history',
    clientReviews:       'client_reviews',
    customFields:        'custom_fields',
    diversity:           'diversity',
    attachments:         'attachments',
  };

  static LOCATORS = {
    fillOrderBtn:                      '#link_resubmitQuickFill',
    orderName:                         '#RecordNavBar .RecordLabel',
    fillOrderModal:                    '#fill-order-modal',
    qccModal:                          '#qcc-form-modal',
    duplicateOrderModal:               '#duplicate-order-modal',
    achievementSnapshotInviteModal:    '#achievement-snapshot-invite',
    rateHistoryModal:                  '#rate-history-modal',
    selectedTab:                       '.TabSelected',
    clientCreditHold:                  '//span[contains(@style, "color:red")]',

    // Summary tab
    summRightColumn:                   '//*[@id="TabPage"]/table/tbody/tr/td[2]',
    summLeftColumn:                    '//*[@id="TabPage"]/table/tbody/tr/td[1]',
    summClientName:                    '#clientName',
    summClientLink:                    '#clientName > a',
    summOrderId:                       '#orderId',
    summDuplicatedFrom:                '#duplicated-from',
    summStartDate:                     '#start-date',
    summEndDate:                       '#end-date',
    summEndDateStatus:                 '#end-date-status',
    summEndReason:                     '#end-reason',
    summMspName:                       '#client-msp-name-field',
    summServiceTaxArea:                '#view-service-tax-area',
    summSicktimeJurisdiction:          '#sicktime-jurisdiction',
    summOvertimeThreshold:             '#overtime-threshold',
    summVmsName:                       '#client-vms-name-field',
    summVmsUri:                        '#client-vms-uri-field',
    summWorkLocationAddress:           '#work-location-address',
    summWorkLocationType:              '#view-work-location-type',
    summSpecificDirections:            '#specific-directions',
    summDivision:                      '#division',
    summMarket:                        '#market',
    summOffSitePreference:             '#off-site-preferences',
    summPlacementType:                 '#placement-type',
    summImportance:                    '#orderImportanceCell',
    summOrderStatus:                   '#current-status',
    summPriority:                      '#priority',
    summRelatedOrders:                 '#related-orders',
    summMaxCandidates:                 '#max-candidates',
    summAccountManager:                '#account-manager',
    summManager:                       '#manager',
    summSalesManager:                  '#sales-manager',
    summOrderAssistedBy:               '#assisted-by',
    summReasonCreated:                 '#reason-created-content',
    summNumberOfOpenings:              '#numberOfOpenings',
    summParentOrderId:                 '#parentOrderId',
    summNumberOfCandidatesPlaced:      '#numberOfCandidatesPlacedText',
    summHowHeard:                      '#how-heard',
    summChildOrders:                   '#child-orders',
    summCreateDate:                    '#create-date',
    summAssistedBy:                    '#assisted-by',
    summFulfillmentManager:            '#fulfillment-mgr',
    summTalentName:                    '#talent-name',
    summTalentLink:                    '#talent-name > a',
    summTalentId:                      '#talentId',
    summOnboardingComplete:            '#onboarding-complete',
    summUsCanOnboardingComplete:       '#us-can-onboarding-complete',
    summOnboardingDetailLinkUrl:       '#onboarding-details-link > a',
    summDisableAutomatedCheckin:       '#disableAutomatedCheckin',
    summClientDisabledCheckin:         '#client-disabled-checkins',
    summPaidByUmbrellaCompany:         '#paid-by-umbrella-company',
    summIsIr35:                        '#public-authority-ir35',
    summIr35Satisfied:                 '#public-authority-ir35-satisifed',
    summAgreementAccepted:             '//td[contains(text(), "Agreement Accepted:")]/following-sibling::td',
    summAquentEquipmentLoaned:         '#equipment-loaned',
    summPinboardPinButton:             '#pinboard-pin-button',
    summRemoteDuringPandemic:          '#remote-during-pandemic',
    summPandemicReturnPlan:            '#pandemic-return-plan',
    summSendTermsEmailBtn:             'a#send-contract-email-link',
    summUsesDtr:                       '#dtr',
    summCommuteLocationType:           '#view-commute-location-type',
    summCommuteDays:                   '#commuteDays',
    summPrimaryModeOfTransportation:   '#commuteTransportType',
    summCommuteDistance:                '#commuteDistance',
    summCommuteDaysNoValue:            '#commuteDaysNoValue',
    summPrimaryTransportNoValue:       '#commuteTransportationTypeNoValue',
    summDateFilled:                    '#order-fill-date',
    summScoutwallSource:               '#scoutwall-source',
    summScoutPositionId:               '#scout-position-id',
    summReportToDisplay:               'td#report-to .valueStyle > a',
    summBillToDisplay:                 'td#bill-to .valueStyle > a',
    summOrderedByDisplay:              'td#ordered-by .valueStyle > a',

    // Position description tab
    pdPositionTitle:                   '#position-title',
    pdNotesForTheOnboarder:            '#notes-for-the-onboarder',
    pdMacPositionTitle:                '#friendly-title',
    pdOrderIntakeStatus:               '#order-intake-status',
    pdSubmittalDetails:                '#submittal-details',
    pdShowMore:                        "//*[contains(text(),'Show More')]",
    pdSubmittalDetailsModBy:           '#submittal-details-mod-by',
    pdMeetingNotes:                    '#order-intake-meeting-notes',
    pdMeetingTranscriptFilename:       '#order-intake-transcript',
    pdMeetingSummary:                  '#order-intake-transcript-summary',
    pdLroTarget:                       "//div[@id='lroTargetContent']//p/strong",
    pdClientJobDescription:            '#client-job-description-content',
    pdMinorSegment:                    '#segment-text',

    // Contact
    contactBillTo:                     '#bill-to',
    contactOrderedBy:                  '#ordered-by',
    contactReportTo:                   '#report-to',
    contactQccReviewer:                'td#qccReviewerName .valueStyle > a',

    // Order credit
    orderCredits:                      '.orderCredits',
    orderCreditName:                   '.agentName',
    orderCreditPercentage:             '.percentage',
    orderCreditStartDate:              '#order-credit-date',

    // Financial (view-only summary)
    finPayType:                        '#talent-pay-type',
    finMspName:                        '#client-msp-name-field',
    finVmsName:                        '#client-vms-name-field',
    finWebPosted:                      '#web-posted',
    finWeekEndingDay:                  '#week-ending-day',

    // Financial info tab
    fiEstGp:                           '#est-gp',
    fiRegPayRate:                      '#regularPayRateValue',
    fiOvertimePayRate:                 '#ot-pay-rate',
    fiDoubleTimePayRate:               '#dt-pay-rate',
    fiRegularBillRate:                 '#reg-bill-rate',
    fiOvertimeBillRate:                '#ot-bill-rate',
    fiDoubleTimeBillRate:              '#dt-bill-rate',
    fiGrossPayRegular:                 '#reg-gross-pay-rate',
    fiGrossPayOvertime:                '#ot-gross-pay-rate',
    fiGrossPayDoubleTime:              '#dt-gross-pay-rate',
    fiHoursPerWeek:                    '#hours-per-week',
    fiOtRatio:                         '#ot-ratio',
    fiMarkUpPercent:                   '#project-markup',
    fiHourlyMarkupValue:               '#hourly-markup',
    fiPurchaseOrder:                   '#purchase-order',
    fiHourlyRateType:                  '#hourly-rate-type',
    fiDailyRateType:                   '#daily-rate-type',
    fiPotentialGp:                     '#potential-gp',
    fiHiddenPotentialGp:               '#estimated-gp',
    fiDiscount:                        '#discount',
    fiPercentToFill:                   '#percentToFill',
    fiPercentToFillOverrideMessage:    '#percentToFillOverrideMessage',
    fiMinSalary:                       '#salaryMinimum',
    fiMaxSalary:                       '#salaryMaximum',
    fiMinPayRate:                      '#min-pay',
    fiMaxPayRate:                      '#max-pay',
    fiMinBillRate:                     '#min-bill-rate',
    fiMaxBillRate:                     '#maxBillRate',
    fiPayRateLabel:                    '#payRateLabel',
    fiBillRateLabel:                   '#billRateLabel',
    fiThresholdDailyOt:                '#thresholds tr:nth-child(2) > td.FieldContent',
    fiThresholdDailyDt:                '#thresholds tr:nth-child(3) > td.FieldContent',
    fiThresholdSaturdayOt:             '#thresholds tr:nth-child(4) > td.FieldContent',
    fiThresholdSaturdayDt:             '#thresholds tr:nth-child(5) > td.FieldContent',
    fiThresholdSundayOt:               '#thresholds tr:nth-child(6) > td.FieldContent',
    fiThresholdSundayDt:               '#thresholds tr:nth-child(7) > td.FieldContent',
    fiThresholdWeeklyOt:               '#thresholds tr:nth-child(8) > td.FieldContent',
    fiThresholdWeeklyDt:               '#thresholds tr:nth-child(9) > td.FieldContent',
    fiViewRateHistoryLink:             '#viewRateHistory',
    fiOrderInvoiceInfo:                '#order-info-info',

    // Position (view-only)
    posTitle:                          '#position-title',
    posMacJobTitle:                    '#friendly-title',
    posWorkgroup:                      '#workgroup',
    posInternalOrderInfo:              '#internal-order-info',
    posNotesForTheOnboarder:           '#notes-for-the-onboarder',

    // QCC history table
    qccRow:                            '//table[@id="qcc_history"]/tbody/tr',
    qccFirstRowContact:                '//*[@id="qcc_history"]/tbody/tr[1]/td[2]/span',
    qccFirstRowAdditionalNotes:        '//*[@id="qcc_history"]/tbody/tr[1]/td[10]/div',
    qccFirstRowGeneratedBy:            '//*[@id="qcc_history"]/tbody/tr[1]/td[3]/span',
    qccFirstRowResponseDate:           '//*[@id="qcc_history"]/tbody/tr[1]/td[5]',
    qccLastRowAdditionalNotes:         '//*[@id="qcc_history"]/tbody/tr[last()]/td[10]/div',
    qccLastRowGeneratedBy:             '//*[@id="qcc_history"]/tbody/tr[last()]/td[3]/span',
    qccLastRowResponseDate:            '//*[@id="qcc_history"]/tbody/tr[last()]/td[5]',

    // QCC/QCT cards
    qccCard:                           '.orderQccCard',
    qctCards:                          '.qct-card',
    qctSurveyType:                     '.survey-type-value',
    qctReviewStatus:                   '.qct-status-value',
    qctShowFilter:                     '#qct-show-filter',
    qctSortSelect:                     '#qct-sort-select',
    qctSortCompletedDate:              '.completed-date',
    qctSortRatingNumber:               '.qct-rating-number',
    qctActionButtons:                  '.bottomButtonsDiv',

    // Custom fields tab
    cfFieldContent:                    '//*[@id="TabPage"]/table/tbody/tr[2]/td[2][contains(text(), "Autotest")]',
    cfCustomFieldRow:                  "*//div[@pageid='custom_fields']/table/tbody/tr",
    cfCustomFieldRowTitle:             'td:nth-child(1)',
    cfCustomFieldRowValue:             'td:nth-child(2)',
    cfCustomFieldRowResponsibleParty:  'td:nth-child(3)',
    cfCustomFieldRowForOnboarding:     'td:nth-child(4)',

    // Diversity tab
    divNoGoalText:                     '#noGoalText',
    divGenderFemale:                   '#genderFemale',
    divGenderMale:                     '#genderMale',
    divLgbtqRow:                       '#lgbtqRow',
    divEthnicityAfricanAmerican:       '#ethnicityAfricanAmerican',
    divEthnicityAmericanIndianAlaskanNative: '#ethnicityAmericanIndianAlaskanNative',
    divEthnicityAsian:                 '#ethnicityAsian',
    divEthnicityHispanic:              '#ethnicityHispanic',
    divEthnicityNativeHawaiian:        '#ethnicityNativeHawaiian',
    divEthnicityTwoRaces:              '#ethnicityTwoRaces',
    divEthnicityWhite:                 '#ethnicityWhite',
    divVeteranRow:                     '#veteranStatusRow',
    divDisabilityRow:                  '#disabilityRow',
    divNeurodivergentRow:              '#neurodivergentRow',

    // Misc
    orderSendToCeridianBtn:            'a#link_sendOrderToCeridian div',

    // Attachments
    attTable:                          '#attachments-table',

    // Job tracker widget
    jtFrame:                           '#jobTrackerWidgetFrame',
    jtChipSet:                         '.job-tracker-chip',
    jtChipRunning:                     '.chip-running',
    jtChipSuccess:                     '.chip-success',
    jtChipFailure:                     '.chip-failure',
    jtChipInactive:                    '.chip-inactive',
    jtRescoreChip:                     '//mat-chip[contains(.//span[@class="job-status-text"], "ReScore")]',
    jtWidgetRow:                       '.jobTrackerWidget',
  };

  static PROC_MAPPINGS = [
    'AWUIDrawViewOrderDetail',
  ];

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  // --- Navigation ---

  async edit() {
    await this.clickAsaba('AWUIDrawEditOrderDetail');
  }

  async viewPostingDetail() {
    await this.clickAsaba('AWUIDrawViewPostingScreen');
  }

  async openTalentDetailFromLink() {
    await this.page.locator(OrderViewDetail.LOCATORS.summTalentLink).click();
  }

  async clickManageCandidates() {
    await this.clickAsaba('AWUIDrawManageCandidates');
  }

  // --- Quick fill ---

  /**
   * Opens the quick fill modal.
   *
   * @returns {FillOrder}
   */
  async openQuickFill() {
    await this.clickAsaba('quickFill');
    return new FillOrder(this.page.locator(OrderViewDetail.LOCATORS.fillOrderModal));
  }

  /**
   * Performs a quick fill with the given data.
   *
   * @param {Object} data
   * @param {string} data.talentId
   * @param {string} data.workLocationType
   * @param {string} [data.taxArea]
   */
  async quickFill(data) {
    await this.ensureTalentReadyToWork(data.talentId);
    await this.clickAsaba('quickFill');
    const modal = new FillOrder(this.page.locator(OrderViewDetail.LOCATORS.fillOrderModal));
    await modal.setTalentId(data.talentId);
    await modal.setWorkLocationType(data.workLocationType);
    if (data.taxArea) {
      await modal.setTaxArea(data.taxArea);
    }
    await modal.submitWorkLocationChange();
    await this.checkAndDismissAutoRejectionEmailModal();
  }

  /**
   * Checks if the order is currently filled.
   *
   * @returns {Promise<boolean>}
   */
  async isFilled() {
    return this.page.locator(`a[name="unfillOrder"], [onclick*="unfillOrder"]`).isVisible();
  }

  /**
   * Unfills the order, accepting any alert.
   */
  async unfill() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.clickAsaba('unfillOrder');
  }

  // --- Duplicate order ---

  /**
   * Opens the duplicate order dialog.
   *
   * @returns {DuplicateOrderDialog}
   */
  async openDuplicateOrder() {
    await this.clickAsaba('duplicateOrder');
    await this.page.locator(OrderViewDetail.LOCATORS.duplicateOrderModal)
      .waitFor({ state: 'visible', timeout: 15000 });
    return new DuplicateOrderDialog(this.page.locator(OrderViewDetail.LOCATORS.duplicateOrderModal));
  }

  /**
   * Duplicates the order with the given configuration.
   *
   * @param {Object} data
   * @param {string} data.whyDupe
   * @param {boolean} [data.fillSameTalent]
   * @param {boolean} [data.keepCustomFieldValues]
   * @param {boolean} data.copyTalent
   * @param {boolean} data.orderDupe
   */
  async duplicateOrder(data) {
    await this.clickAsaba('duplicateOrder');
    const modal = new DuplicateOrderDialog(this.page.locator(OrderViewDetail.LOCATORS.duplicateOrderModal));
    await modal.setDuplicateReason(data.whyDupe);
    if (data.fillSameTalent != null) {
      await modal.setFillWithSameTalent(data.fillSameTalent);
    }
    if (data.keepCustomFieldValues != null) {
      await modal.setKeepCustomFieldValues(data.keepCustomFieldValues);
    }
    await modal.setCopyTalentToNewOrder(data.copyTalent);
    await modal.setDuplicateAsOrder(data.orderDupe);
    await modal.submit();
  }

  // --- Achievement snapshot ---

  async openCaptureAchievementSnapshot() {
    await this.clickAsaba('openAchievementSnapshotInvite');
    const modal = new AchievementSnapshotInviteModal(
      this.page.locator(OrderViewDetail.LOCATORS.achievementSnapshotInviteModal)
    );
    await modal.waitUntilReady();
    return modal;
  }

  // --- QCC ---

  async clickEnterQcc() {
    await this.clickAsaba('showQccForm');
    return new QCCModal(this.page.locator(OrderViewDetail.LOCATORS.qccModal));
  }

  // --- Summary getters ---

  async getOrderId() {
    await this.switchTab('summary');
    return this.page.locator(OrderViewDetail.LOCATORS.summOrderId).textContent();
  }

  async getVendorManagementSystemName() {
    return this.page.locator(OrderViewDetail.LOCATORS.summVmsName).textContent();
  }

  async getVendorManagementSystemUri() {
    return this.page.locator(OrderViewDetail.LOCATORS.summVmsUri).textContent();
  }

  async getManagedServiceProviderName() {
    return this.page.locator(OrderViewDetail.LOCATORS.summMspName).textContent();
  }

  async workLocationAddressAfterChange() {
    const text = await this.page.locator(OrderViewDetail.LOCATORS.summWorkLocationAddress).textContent();
    return text.trim().replace(/\n/g, ' ');
  }

  async serviceTax() {
    return this.page.locator(OrderViewDetail.LOCATORS.summServiceTaxArea).textContent();
  }

  async sicktimeJurisdiction() {
    return this.page.locator(OrderViewDetail.LOCATORS.summSicktimeJurisdiction).textContent();
  }

  async overtimeThreshold() {
    return this.page.locator(OrderViewDetail.LOCATORS.summOvertimeThreshold).textContent();
  }

  // --- Tab values collector ---

  /**
   * Collects all text values from all tab locators.
   *
   * @returns {Promise<Object>}
   */
  async values() {
    const result = {};
    const tabLocatorPrefixes = {
      summary: 'summ',
      positionDescription: 'pd',
      financialInfo: 'fi',
      customFields: 'cf',
      diversity: 'div',
      attachments: 'att',
    };

    for (const [tabKey, prefix] of Object.entries(tabLocatorPrefixes)) {
      await this.switchTab(tabKey);
      for (const [locKey, selector] of Object.entries(OrderViewDetail.LOCATORS)) {
        if (locKey.startsWith(prefix)) {
          try {
            const el = this.page.locator(selector);
            if (await el.count() > 0) {
              result[locKey] = await el.first().textContent();
            }
          } catch {
            // skip unreachable locators
          }
        }
      }
    }

    return result;
  }

  // --- Custom fields ---

  /**
   * Finds a custom field row by title and returns its locator.
   *
   * @param {string} customField
   * @returns {Promise<import('@playwright/test').Locator|null>}
   */
  async getCustomFieldRow(customField) {
    await this.switchTab('customFields');
    const rows = this.page.locator(OrderViewDetail.LOCATORS.cfCustomFieldRow);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const title = (await row.locator(OrderViewDetail.LOCATORS.cfCustomFieldRowTitle).textContent()).trim();
      if (title.toLowerCase() === customField.toLowerCase()) {
        return row;
      }
    }
    return null;
  }

  // --- Tab state ---

  /**
   * Gets the tab ID of the currently selected tab.
   *
   * @returns {Promise<string>}
   */
  async getSelectedTab() {
    return this.page.locator(OrderViewDetail.LOCATORS.selectedTab).getAttribute('tabid');
  }

  // --- Rate history ---

  /**
   * Opens the rate history modal.
   *
   * @returns {OrderRatesViewModal}
   */
  async openViewRateHistory() {
    await this.page.locator(OrderViewDetail.LOCATORS.fiViewRateHistoryLink).click();
    return new OrderRatesViewModal(this.page.locator(OrderViewDetail.LOCATORS.rateHistoryModal));
  }

  // --- Financial info getters ---

  async getPayRateLabel() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiPayRateLabel).textContent();
  }

  async getBillRateLabel() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiBillRateLabel).textContent();
  }

  async getMinPayRate() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiMinPayRate).textContent();
  }

  async getMaxPayRate() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiMaxPayRate).textContent();
  }

  async getMinBillRate() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiMinBillRate).textContent();
  }

  async getMaxBillRate() {
    if (await this.getSelectedTab() !== 'financial_info') {
      await this.switchTab('financialInfo');
    }
    return this.page.locator(OrderViewDetail.LOCATORS.fiMaxBillRate).textContent();
  }

  /**
   * Gets all submittal range rates as an object.
   *
   * @returns {Promise<Object>}
   */
  async getAllSubmittalRangeRates() {
    return {
      minPayRate:  await this.getMinPayRate(),
      maxPayRate:  await this.getMaxPayRate(),
      minBillRate: await this.getMinBillRate(),
      maxBillRate: await this.getMaxBillRate(),
    };
  }

  // --- Job tracker chip interactions ---

  /**
   * Dispatches a mouseenter event on the mat-chip at the given index.
   *
   * @param {number} index
   */
  async hoverJobTrackerChip(index) {
    await this.page.evaluate((idx) => {
      document.querySelectorAll('mat-chip')[idx]
        .dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    }, index);
  }

  /**
   * Dispatches a mouseleave event on the mat-chip at the given index.
   *
   * @param {number} index
   */
  async leaveJobTrackerChip(index) {
    await this.page.evaluate((idx) => {
      document.querySelectorAll('mat-chip')[idx]
        .dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, index);
  }
}

module.exports = { OrderViewDetail };
