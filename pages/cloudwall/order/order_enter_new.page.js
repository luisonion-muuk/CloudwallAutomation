const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class that supports operations related to the Enter New Order screen.
 *
 * ATTENTION: FULL CREATE_ORDER METHODS ARE FOUND IN ORDER_UTIL.
 */
class EnterNewOrder extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawEnterNewOrder';

  static TAB_IDS = {
    clientNameMarket: 'ClientNameMarket',
  };

  static LOCATORS = {
    createOrderButton:  '#link_selectClient > div',
    marketSelect:       '#marketList',
    clientName:         '#clientName',
    clientOptionList:   '#tasOptionList',
    firstClientOption:  '#tasOptionRow0',
  };

  static FIELDS = {
    marketSelect:      { tab: 'clientNameMarket', type: 'select' },
    clientName:        { tab: 'clientNameMarket', type: 'text' },
    firstClientOption: { tab: 'clientNameMarket', type: 'waitFindClick' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawEnterNewOrder',
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
   * Waits for the client name field to be visible before interacting.
   */
  async waitUntilReady() {
    await this.page.locator(EnterNewOrder.LOCATORS.clientName)
      .waitFor({ state: 'visible' });
  }

  /**
   * Enters the market and client name, then clicks the create new order button.
   *
   * @param {Object} orderData
   * @param {string} orderData.marketValue
   * @param {string} orderData.clientName
   */
  async startNewOrder(orderData) {
    await this.setMarket(orderData.marketValue);
    await this.setClientName(orderData.clientName);
    await this.clickCreateOrderButton();
  }

  /**
   * Selects a market from the dropdown by value.
   *
   * @param {string|number} marketValue
   */
  async setMarket(marketValue) {
    await this.page.locator(EnterNewOrder.LOCATORS.marketSelect)
      .selectOption({ value: String(marketValue) });
  }

  /**
   * Types the client name and selects the first autocomplete option.
   *
   * @param {string} clientName
   */
  async setClientName(clientName) {
    const field = this.page.locator(EnterNewOrder.LOCATORS.clientName);
    await field.clear();
    await field.fill(clientName);
    await this.page.locator(EnterNewOrder.LOCATORS.firstClientOption)
      .waitFor({ state: 'visible', timeout: 5000 });
    await this.page.locator(EnterNewOrder.LOCATORS.firstClientOption).click();
  }

  /**
   * Clicks the Create Order button.
   */
  async clickCreateOrderButton() {
    await this.page.locator(EnterNewOrder.LOCATORS.createOrderButton).click();
  }
}

module.exports = { EnterNewOrder };
