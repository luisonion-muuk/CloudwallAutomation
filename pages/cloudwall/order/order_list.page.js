const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class that supports operations related to the Order List page.
 */
class OrderList extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawOrderList';

  static LOCATORS = {
    quickSearch:                '#quickSearch',
    runQuickSearch:             '#runQuickSearch > div',
    newDetailSearchButton:      'a#new-search > div',
    editCurrentSearch:          '#EditSearchLink > div',
    savedSearch:                '#savedSearch',
    goButton:                   '#search-bar-go-button > div',
    newOrderButton:             'a[title="New Order"] > div',
    orderDetailDropdownButton:  'a[id*=AWUIDrawViewOrderDetail] .ActionButtonSubMenuArrow',
    editOrderButton:            'span[onclick*="AWUIDrawEditOrderDetail"].actionSubMenuItem',
  };

  static SAVED_SEARCH_OPTIONS = [
    'Active Orders In My Market',
    'My Active Orders',
    'My Orders With New Candidates',
    'My Posted Orders',
    'My Unfilled Orders',
    'Orders With New Candidates In My Market',
    'Posted Orders In My Market',
    'Unfilled Orders In My Market',
    'My Recently Viewed Orders',
    'Talent Pools In My Market',
    'My Talent Pools',
    'All Upcoming Ends',
    'My Upcoming Ends',
    'All Recent Ends',
    'My Recent Ends',
  ];

  static PROC_MAPPINGS = [
    'AWUIDrawOrderList',
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
   * Waits for the quick search field to be visible before interacting.
   */
  async waitUntilReady() {
    await this.page.locator(OrderList.LOCATORS.quickSearch)
      .waitFor({ state: 'visible' });
  }

  /**
   * Types a search term and runs the quick search.
   *
   * @param {string} text
   */
  async runQuickSearch(text) {
    await this.page.locator(OrderList.LOCATORS.quickSearch).fill(text);
    await this.page.locator(OrderList.LOCATORS.runQuickSearch).click();
  }

  /**
   * Selects a saved search and clicks Go.
   *
   * @param {string} savedSearchName
   */
  async runSavedSearch(savedSearchName) {
    await this.selectSavedSearch(savedSearchName);
    await this.go();
  }

  /**
   * Selects a saved search option from the dropdown.
   *
   * @param {string} savedSearchName
   * @throws {Error} If the search name is not a valid option
   */
  async selectSavedSearch(savedSearchName) {
    if (!OrderList.SAVED_SEARCH_OPTIONS.includes(savedSearchName)) {
      throw new Error(
        `Invalid search option: "${savedSearchName}"\n` +
        `Valid choices are: ${OrderList.SAVED_SEARCH_OPTIONS.join(', ')}`
      );
    }
    await this.page.locator(OrderList.LOCATORS.savedSearch)
      .selectOption({ label: savedSearchName });
  }

  /**
   * Clicks the Go button.
   */
  async go() {
    await this.page.locator(OrderList.LOCATORS.goButton).click();
  }

  /**
   * Clicks the New Order button.
   */
  async clickNewOrderButton() {
    await this.page.locator(OrderList.LOCATORS.newOrderButton).click();
  }

  /**
   * Opens the order detail dropdown and clicks the Edit Order button.
   */
  async clickOrderEditButton() {
    await this.page.locator(OrderList.LOCATORS.orderDetailDropdownButton).click();
    await this.page.locator(OrderList.LOCATORS.editOrderButton).click();
  }
}

module.exports = { OrderList };
