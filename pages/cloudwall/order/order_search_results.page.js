const { BaseSearchResults } = require('../arealist/base_search_results');

/**
 * Represents order search results.
 */
class OrderSearchResults extends BaseSearchResults {

  static ENTITY_ID = 4;

  static LOCATORS = {
    areaListBody:                '#areaListBody',
    mostRecentQccResponseRow:    '//*[@id="tableNode"]/tbody/tr',
    mostRecentQccResponseCol:    'td:nth-child(2)',
    mostRecentQccResponseHeader: '//*[@id="tableNode"]/thead/tr/th[contains(text(), "Most recent QCC response date")]',
    estGpRow:                    '//*[@id="tableNode"]/tbody/tr',
    estGpCol:                    'td:nth-child(2)',
    estGpHeader:                 '//*[@id="tableNode"]/thead/tr/th[contains(text(), "GP$ (Est)")]',
    areaListHeader:              '#tableNode > thead > tr',
    resultsTblHeader:            '//*[@id="tableNode"]/thead/tr',
  };

  static COLUMNS = {
    orderId:                    'int',
    importance:                 'text',
    client:                     'text',
    title:                      'text',
    startDate:                  'date',
    endDate:                    'date',
    type:                       'text',
    accountManager:             'text',
    salesManager:               'text',
    orderStatus:                'text',
    priority:                   'text',
    workgroup:                  'text',
    numberOfOpenings:           'text',
    numberOfOpeningsRemaining:  'text',
    fulfillmentManager:         'text',
    assistedBy:                 'text',
    orderEndDateStatus:         'text',
  };

  static JUST_ORDER_ID = {
    hiddenFirstColumn: 'int',
    orderId:           'int',
  };

  static MY_ACTIVE_ORDERS = {
    orderId:        'int',
    importance:     'text',
    client:         'text',
    talent:         'text',
    title:          'text',
    startDate:      'date',
    endDate:        'date',
    type:           'text',
    accountManager: 'text',
    salesManager:   'text',
    orderStatus:    'text',
    priority:       'text',
  };

  static TALENT_PAID_VIA_UMBRELLA_COLUMNS = {
    defaultHidden:          'int',
    importance:             'text',
    client:                 'text',
    title:                  'text',
    startDate:              'date',
    endDate:                'date',
    type:                   'text',
    accountManager:         'text',
    salesManager:           'text',
    orderStatus:            'text',
    priority:               'text',
    workgroup:              'text',
    paidViaUmbrellaCompany: 'text',
    orderIdDisplayed:       'int',
  };

  static COLUMNS_FOR_INTERNAL_RECORD = {
    orderId:        'int',
    importance:     'text',
    client:         'text',
    title:          'text',
    startDate:      'date',
    endDate:        'date',
    type:           'text',
    accountManager: 'text',
    salesManager:   'text',
    orderStatus:    'text',
    priority:       'text',
    workgroup:      'text',
    internalRecord: 'text',
  };

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  /**
   * Collects order statuses from all rows.
   *
   * @returns {Promise<string[]>}
   */
  async getOrderStatuses() {
    const rows = await this.getAllRows();
    const statuses = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      statuses.push(content.orderStatus);
    }
    return statuses;
  }

  /**
   * Collects order titles from all rows using a given column definition.
   *
   * @param {Object} columns
   * @returns {Promise<string[]>}
   */
  async getOrderTitles(columns) {
    const rows = await this.getAllRows();
    const titles = [];
    for (const row of rows) {
      const content = await this.getNonDefaultContentForRowElement(row, columns);
      titles.push(content.title);
    }
    return titles;
  }

  /**
   * Collects sales manager values from all rows.
   *
   * @returns {Promise<string[]>}
   */
  async getSalesMgrs() {
    const rows = await this.getAllRows();
    const managers = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      managers.push(content.salesManager);
    }
    return managers;
  }

  /**
   * Collects account manager values from all rows.
   *
   * @returns {Promise<string[]>}
   */
  async getAccountManager() {
    const rows = await this.getAllRows();
    const managers = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      managers.push(content.accountManager);
    }
    return managers;
  }

  /**
   * Collects number of openings from all rows.
   *
   * @returns {Promise<string[]>}
   */
  async getNumberOfOpeningsInColumn() {
    const rows = await this.getAllRows();
    const openings = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      openings.push(content.numberOfOpenings.trim());
    }
    return openings;
  }

  /**
   * Gets the fulfillment manager from the last row.
   *
   * @returns {Promise<string>}
   */
  async getFulfillmentManager() {
    const rows = await this.getAllRows();
    let data = '';
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      data = content.fulfillmentManager;
    }
    return data;
  }

  /**
   * Gets the first character of a given column's data from all rows.
   *
   * @param {string} column - Column key
   * @returns {Promise<string>}
   */
  async getColumnData(column) {
    const rows = await this.getAllRows();
    let data = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      const value = content[column].trim();
      data = value[0];
    }
    return data;
  }

  /**
   * Collects values from a specific column across all rows.
   *
   * @param {string} column - Column key
   * @returns {Promise<string[]>}
   */
  async getAgentColumns(column) {
    const rows = await this.getAllRows();
    const agents = [];
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      agents.push(content[column].trim());
    }
    return agents;
  }

  /**
   * Gets the order end date status from the last row.
   *
   * @returns {Promise<string>}
   */
  async getOrderEndDateStatus() {
    const rows = await this.getAllRows();
    let data = '';
    for (const row of rows) {
      const content = await this.getContentForRowElement(row);
      data = content.orderEndDateStatus;
    }
    return data;
  }
}

module.exports = { OrderSearchResults };
