const { SearchPage } = require('../search_page');
const { Select2 } = require('../../elements/select2_element');

/**
 * Page class supporting operations related to the Order Detail Search screen.
 */
class OrderDetailSearch extends SearchPage {

  static PROC_NAME = 'AWUIDrawOrderDetailSearch';

  static TAB_IDS = {
    main:             'main',
    segments:         'segments',
    skills:           'skills',
    candidateStatus:  'candidateStatus',
    activitySearch:   'activitySearch',
    searchColumns:    'searchColumns',
  };

  static LOCATORS = {
    // Main fields
    orderId:                          '[name="orderID"]',
    market:                           '[name="market"]',
    country:                          '[name="country"]',
    includeOffSite:                   '[name="includeOffSite"]',
    talentPool:                       '[name="isTalentPool"]',
    workLocation:                     '[name="work-location"]',
    metaClient:                       '#s2id_metaClientName',
    clientName:                       '[name="clientName"]',
    internalRecord:                   '[name="internalRecord"]',
    importTimecards:                  '[name="importTimecards"]',
    overtimeExemption:                '[name="overtimeExemption"]',
    isOvertimeBeingPaid:              '[name="isOvertimeBeingPaid"]',
    mostRecentQccResponseDateOp:      '#most_recent_qcc_response_date_operator',
    createDateOp:                     '#create_date_operator',
    createDateStart:                  '#create_date_start',
    createDateEnd:                    '#create_date_end',
    startDateOp:                      '#start_date_operator',
    startDateStart:                   '#start_date_start',
    startDateEnd:                     '#start_date_end',
    endDateOp:                        '#end_date_operator',
    endDateStart:                     '#end_date_start',
    endDateEnd:                       '#end_date_end',
    mostRecentQccResponseDateStart:   '#most_recent_qcc_response_date_start',
    mostRecentQccResponseDateEnd:     '#most_recent_qcc_response_date_end',
    isPosted:                         '[name="isPosted"]',
    numberOfOpeningsOp:               '#openings_operator',
    numberOfOpeningsMin:              '#openings_min',
    numberOfOpeningsMax:              '#openings_max',
    positionTitle:                    '[name="positionTitle"]',
    activityList:                     '#activityList0',
    activityDateOp:                   '#activity_date0_operator',
    activityDateStart:                '#activity_date0_start',
    orderAssistedBySelect:            '#s2id_asstByList',
    orderStatus:                      '[name="orderStatus"]',
    excludeChildOrders:               '[name="exclude_child_orders"]',
    agentList1:                       '#s2id_agentList1',
    agentType1:                       '#agentType1',
    agentList2:                       '#s2id_agentList2',
    agentType2:                       '#agentType2',
    agentAnd:                         '//*[@id="andOrDiv"]/label[1]',
    agentOr:                          '//*[@id="andOrDiv"]/label[2]',
    removeAgentTwo:                   '#removeAgentTwo',
    saveSearch:                       '[name="searchName"]',
    orderEndDateStatus:               '[name="orderEndDateStatus"]',
    orderEndReason:                   '[name="orderEndReason"]',
    aquentCorporate:                  '#division\\:250',
    orderImportance:                  '#order-importance',
    rateType:                         '[name="rateType"]',
    howHeard:                         '#how-heard',
    isTalentPaidViaUmbrellaCompany:   '[name="is_talent_paid_via_umbrella_company"]',
    isRemoteDuringPandemic:           '#is_remote_during_pandemic',
    onSitePreference:                 '#off_site_preference_id',
    needsDiversitySourcingHelp:       '#needsDiversitySourcing',
    placementType:                    '[name="placementType"]',

    // Search columns
    scOptionsColumn:       '#column_options',
    scSelectColumn:        '#column_select',
    scLeftButton:          '//*[@id="column_options_table"]/tbody/tr/td/a/div[contains(text(), "<<")]',
    scRightButton:         '//*[@id="column_options_table"]/tbody/tr/td/a/div[contains(text(), ">")]',
    scArrowButtons:        '.PickListButton',
    scUpButton:            '//*[@id="column_options_table"]/tbody/tr/td/a/div[contains(text(), "Up")]',
    scDownButton:          '//*[@id="column_options_table"]/tbody/tr/td/a/div[contains(text(), "Dn")]',
    scSaveSearch:          '[name="searchName"]',
    scSaveButton:          'a#link_save > div',
    scSaveExecuteButton:   'a#link_save_execute > div',
    scExecuteButton:       'a#link_execute > div',

    // Candidate statuses
    csTalentAppliedOnline:       '#candidateStatus\\:10',
    csSubmittedToClient:         '#candidateStatus\\:50',
    csClientInterviewScheduled:  '#candidateStatus\\:60',
    csRejectedByRecruiter:       '#candidateStatus\\:90',
    csFillOrder:                 '#candidateStatus\\:130',
  };

  static FIELDS = {
    orderId:                         { tab: 'main', type: 'text' },
    market:                          { tab: 'main', type: 'select' },
    country:                         { tab: 'main', type: 'select' },
    includeOffSite:                  { tab: 'main', type: 'checkbox' },
    aquentCorporate:                 { tab: 'main', type: 'checkbox' },
    talentPool:                      { tab: 'main', type: 'radio' },
    isPosted:                        { tab: 'main', type: 'checkbox' },
    createDateOp:                    { tab: 'main', type: 'select' },
    createDateStart:                 { tab: 'main', type: 'text' },
    createDateEnd:                   { tab: 'main', type: 'text' },
    startDateOp:                     { tab: 'main', type: 'select' },
    startDateStart:                  { tab: 'main', type: 'text' },
    startDateEnd:                    { tab: 'main', type: 'text' },
    endDateOp:                       { tab: 'main', type: 'select' },
    endDateStart:                    { tab: 'main', type: 'text' },
    endDateEnd:                      { tab: 'main', type: 'text' },
    mostRecentQccResponseDateOp:     { tab: 'main', type: 'select' },
    mostRecentQccResponseDateStart:  { tab: 'main', type: 'text' },
    mostRecentQccResponseDateEnd:    { tab: 'main', type: 'text' },
    workLocation:                    { tab: 'main', type: 'multiCheckbox' },
    metaClient:                      { tab: 'main', type: 'select2' },
    clientName:                      { tab: 'main', type: 'text' },
    internalRecord:                  { tab: 'main', type: 'radio' },
    orderStatus:                     { tab: 'main', type: 'multiCheckbox' },
    numberOfOpeningsOp:              { tab: 'main', type: 'select' },
    numberOfOpeningsMin:             { tab: 'main', type: 'text' },
    numberOfOpeningsMax:             { tab: 'main', type: 'text' },
    positionTitle:                   { tab: 'main', type: 'text' },
    importTimecards:                 { tab: 'main', type: 'radio' },
    overtimeExemption:               { tab: 'main', type: 'radio' },
    isOvertimeBeingPaid:             { tab: 'main', type: 'radio' },
    activityList:                    { type: 'select' },
    activityDateOp:                  { tab: 'activitySearch', type: 'select' },
    activityDateStart:               { tab: 'activitySearch', type: 'text' },
    agentType1:                      { type: 'select' },
    agentType2:                      { type: 'select' },
    saveSearch:                      { tab: 'searchColumns', type: 'text' },
    orderEndDateStatus:              { tab: 'main', type: 'multiCheckbox' },
    orderEndReason:                  { tab: 'main', type: 'multiCheckbox' },
    orderImportance:                 { tab: 'main', type: 'select' },
    rateType:                        { tab: 'main', type: 'multiCheckbox' },
    howHeard:                        { tab: 'main', type: 'select' },
    isTalentPaidViaUmbrellaCompany:  { tab: 'main', type: 'checkbox' },
    needsDiversitySourcingHelp:      { tab: 'main', type: 'checkbox' },
    placementType:                   { tab: 'main', type: 'multiCheckbox' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawOrderDetailSearch',
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
   * Sets the create date start field.
   *
   * @param {Date} date
   */
  async setCreateDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formatted = `${month}/${day}/${year}`;

    const field = this.page.locator(OrderDetailSearch.LOCATORS.createDateStart);
    await field.fill(formatted);
  }

  /**
   * Sets the "Assisted By" agent using Select2.
   *
   * @param {string} agentName
   */
  async setAssistedBy(agentName) {
    const select = new Select2(this.page.locator(OrderDetailSearch.LOCATORS.orderAssistedBySelect));
    await select.setSearchText(agentName);
    await select.selectResultByNumber(1);
  }

  /**
   * Sets Agent One using Select2.
   *
   * @param {string} agentName
   */
  async setAgentOne(agentName) {
    const select = new Select2(this.page.locator(OrderDetailSearch.LOCATORS.agentList1));
    await select.setSearchText(agentName);
    await select.selectResultByNumber(1);
  }

  /**
   * Clears the Agent One Select2 field.
   */
  async clearAgentOne() {
    const select = new Select2(this.page.locator(OrderDetailSearch.LOCATORS.agentList1));
    await select.clearSingleEntry();
  }

  /**
   * Gets the current Agent One value.
   *
   * @returns {Promise<string>}
   */
  async getAgentOneValue() {
    const select = new Select2(this.page.locator(OrderDetailSearch.LOCATORS.agentList1));
    return select.getValue();
  }

  /**
   * Sets Agent Two using Select2.
   *
   * @param {string} agentName
   */
  async setAgentTwo(agentName) {
    const select = new Select2(this.page.locator(OrderDetailSearch.LOCATORS.agentList2));
    await select.setSearchText(agentName);
    await select.selectResultByNumber(1);
  }

  /**
   * Runs an order search by market and activity.
   *
   * @param {Object} params
   * @param {string} params.market - Market ID
   * @param {string} params.activity_type - Activity type value
   * @param {string} params.activity_date_operator - Date operator value
   * @param {string} date - Date formatted as MM/DD/YYYY
   */
  async runOrderSearchByActivity(params, date) {
    await this.page.locator(OrderDetailSearch.LOCATORS.market).selectOption(params.market);
    await this.switchTab('activitySearch');
    await this.setField('activityList', params.activity_type);
    await this.setField('activityDateOp', params.activity_date_operator);
    await this.setField('activityDateStart', date);

    await this.executeSearch();
    await this.waitForSearchComplete();
  }

  /**
   * Runs an order search by market and end date status.
   *
   * @param {Object} params
   * @param {string} params.market - Market ID
   * @param {string} params.order_end_date_status - End date status value
   * @param {string} params.end_date_status_operator - Date operator value
   * @param {string} date - Date formatted as MM/DD/YYYY
   */
  async runOrderSearchByEndDateStatus(params, date) {
    await this.page.locator(OrderDetailSearch.LOCATORS.market).selectOption(params.market);
    await this.setField('orderEndDateStatus', params.order_end_date_status);
    await this.switchTab('activitySearch');
    await this.setField('activityDateOp', params.end_date_status_operator);
    await this.setField('activityDateStart', date);

    await this.executeSearch();
    await this.waitForSearchComplete();
  }
}

module.exports = { OrderDetailSearch };
