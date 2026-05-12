// order_util.js

const { loadData } = require('../util.js');
const { createOrderWithoutPostingSql, createOrderWithPostingSql } = require('../../utils/cloudwall/order_sql_util');
const { createPostingForMarket } = require('./job_posting_util');

/**
 * Creates an order without posting in the database via SQL.
 *
 * @param {Object|null} orderInfo - Order data hash
 * @param {string|null} user - User for created_by
 * @param {Object} context - Object containing helpers (readFeaturesBatch, config, etc.)
 * @returns {Promise<string>}
 */
async function createOrderWithoutPostingInDb(orderInfo = null, user = null, context) {
  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency', 'auto-practice-generator']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];
  context.autoPracticeGeneratorFeature = features['auto-practice-generator'];

  if (!context.autoPracticeGeneratorFeature && orderInfo) {
    delete orderInfo.job_type_id;
  }

  return await createOrderWithoutPostingSql(orderInfo, user, context.config);
}

/**
 * Creates an order with posting in the database via SQL.
 *
 * @param {Object|null} orderInfo - Order data hash
 * @param {string|null} user - User for created_by
 * @param {Object} context - Object containing helpers
 * @returns {Promise<string>}
 */
async function createOrderWithPostingInDb(orderInfo = null, user = null, context) {
  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency', 'auto-practice-generator']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];
  context.autoPracticeGeneratorFeature = features['auto-practice-generator'];

  if (!context.autoPracticeGeneratorFeature && orderInfo) {
    delete orderInfo.job_type_id;
  }

  return await createOrderWithPostingSql(orderInfo, user, context.config);
}

/**
 * PREFERRED METHOD FOR CREATING ORDERS.
 * Creates 1 or more orders with default field values for required fields.
 * Pass yaml data to override default values or to set optional fields.
 *
 * @param {Object|Object[]} orderInfo - An order or array of orders to be created
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @returns {Promise<string|string[]>} Order ID(s)
 */
async function createNewOrder(orderInfo, page, context) {
  if (!Array.isArray(orderInfo)) {
    orderInfo = [orderInfo];
  }

  const orderIds = [];

  for (const dataEntry of orderInfo) {
    const orderData = context.transformYaml(dataEntry);

    if (!(await context.topPage.isInstanceOf('Frameset'))) {
      await context.visitAndLogin(page);
    }
    // expect(context.topPage).toBeInstanceOf('Frameset');

    console.log(`ORDER_ENTITY_NAME: ${orderData.order_name}`);

    // Contact id for non-default bill-to, ordered-by, and report-to field vals
    if (orderData.contact_last_name) {
      orderData.contact_id = await getContactId(orderData.contact_last_name, page, context);
    }

    await context.topPage.openModule('order');
    await context.mainPage.clickAsaba('AWUIDrawEnterNewOrder');
    // expect(context.mainPage).toBeInstanceOf('EnterNewOrder');

    await context.mainPage.startNewOrder(orderData);
    await page.waitForTimeout(5000);
    // expect(context.mainPage).toBeInstanceOf('SubmitNewOrder');

    await context.mainPage.setRequiredOrderFields(orderData);
    await context.mainPage.setOptionalOrderFields(orderData);

    if (orderData.UK_specific_fields === true) {
      await context.mainPage.setUkSpecificFields();
    }

    await context.mainPage.submitSave();
    await page.waitForTimeout(3000);
    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

    const orderId = await context.mainPage.getOrderId();
    orderIds.push(orderId);

    if (orderData.quick_fill) {
      await context.mainPage.quickFill(orderData.quick_fill);
    }
  }

  return orderIds.length === 1 ? orderIds[0] : orderIds;
}

/**
 * DEPRECATED: Use createNewOrder instead.
 * Creates orders by passing in yaml data.
 *
 * @param {Object|Object[]} orderInfo - An order or array of orders to be created
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @returns {Promise<string|string[]>} Order ID(s)
 */
async function createOrder(orderInfo, page, context) {
  context.orderIntakeStatusFeature = await context.readFeature('order-intake-status');
  context.autoPracticeGeneratorFeature = await context.readFeature('auto-practice-generator');

  if (!Array.isArray(orderInfo)) {
    orderInfo = [orderInfo];
  }

  const orderIds = [];

  for (const dataEntry of orderInfo) {
    const dataWithSymKeys = context.transformYaml(dataEntry);

    if (!(await context.topPage.isInstanceOf('Frameset'))) {
      await context.visitAndLogin(page);
    }
    // expect(context.topPage).toBeInstanceOf('Frameset');

    console.log(`ORDER_ENTITY_NAME: ${dataWithSymKeys.order_info.position_title}`);
    if (dataWithSymKeys.contact_last_name) {
      dataWithSymKeys.contact_id = await getContactId(dataWithSymKeys.contact_last_name, page, context);
    }

    await context.topPage.openModule('order');
    await context.mainPage.clickAsaba('AWUIDrawEnterNewOrder');
    // expect(context.mainPage).toBeInstanceOf('EnterNewOrder');

    await context.mainPage.createNewOrderFromExistingClient(dataWithSymKeys.market_and_client);
    // expect(context.mainPage).toBeInstanceOf('SubmitNewOrder');

    // Sets on-site/remote preference to `on-site` by default
    dataWithSymKeys.order_info.off_site_preference = dataWithSymKeys.order_info.off_site_preference || 1;

    // Set practice info
    if (context.autoPracticeGeneratorFeature) {
      const oi = dataWithSymKeys.order_info;
      if (oi.segments !== undefined) {
        delete oi.segments;
      }
      await context.mainPage.setPracticeSelect2(dataWithSymKeys.minor_segment);
    } else {
      await context.mainPage.setField('segments', dataWithSymKeys.segments);
    }

    // start date, end date, segments, reason created, how heard, position title, mac job title, internal order info
    await context.mainPage.setFields(dataWithSymKeys.order_info);

    if (dataWithSymKeys.contact_id) {
      const contactId = dataWithSymKeys.contact_id;
      await context.mainPage.setField('bill_to', contactId);
      await context.mainPage.setField('ordered_by', contactId);
      await context.mainPage.setField('report_to', contactId);
    } else {
      await context.mainPage.findSelect('summary', 'bill_to').selectByIndex(1);
      await context.mainPage.findSelect('summary', 'ordered_by').selectByIndex(1);
      await context.mainPage.findSelect('summary', 'report_to').selectByIndex(1);
    }

    if (dataWithSymKeys.add_order_credit) {
      await context.mainPage.addOrderCredit(...dataWithSymKeys.add_order_credit);
    } else {
      // Default is test automation user
      await context.mainPage.addOrderCreditDefault();
    }

    if (dataWithSymKeys.use_dtr_timecards) {
      await context.mainPage.find('summary', 'uses_dtr').click();
    }

    if (dataWithSymKeys.complete_onboarding) {
      await context.mainPage.setOnboardingComplete(dataWithSymKeys.complete_onboarding);
    }

    if (dataWithSymKeys.onboarding_notes) {
      await context.mainPage.setOnboardingNotes(dataWithSymKeys.onboarding_notes);
    }

    if (dataWithSymKeys.financial_info) {
      await enterFinancialInfo(dataWithSymKeys.financial_info, page, context);
    }

    await context.mainPage.billClientOvertimeYes();
    await context.mainPage.payTalentOvertimeYes();
    await context.mainPage.setDirect(1);
    await context.mainPage.setExclusive(1);
    await context.mainPage.setOrderIntakeStatusDropdown();

    await context.mainPage.switchTab('financial_info');
    if (dataWithSymKeys.order_info.placement_type === 1) {
      await context.mainPage.click('financial_info', 'submittal_range_type_perm');
    }

    await context.mainPage.setField('minimum_pay_rate', 90000);
    await context.mainPage.setField('maximum_pay_rate', 180000);

    await context.mainPage.switchTab('financial_info');
    if (dataWithSymKeys.order_info.placement_type === 1) {
      await context.mainPage.click('financial_info', 'submittal_range_type_perm');
    }

    await context.mainPage.setField('minimum_pay_rate', 90000);
    await context.mainPage.setField('maximum_pay_rate', 180000);

    await context.mainPage.submitSave();
    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

    orderIds.push(await context.mainPage.getOrderId());

    if (dataWithSymKeys.quick_fill) {
      await context.mainPage.quickFill(dataWithSymKeys.quick_fill);
    }
  }

  return orderIds.length === 1 ? orderIds[0] : orderIds;
}

/**
 * Creates a talent pool from the contact view detail page.
 *
 * @param {Object} poolInfo - Pool configuration data
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @returns {Promise<string>} The pool ID
 */
async function createTalentPool(poolInfo, page, context) {
  await context.visitAndLogin(page, 'ContactViewDetail', poolInfo.contact_id);
  // expect(context.mainPage).toBeInstanceOf('ContactViewDetail');
  await context.mainPage.clickAsaba('/webwall/pools');
  // expect(context.mainPage).toBeInstanceOf('TalentPoolEditActionScreen');

  await context.mainPage.setPoolName(poolInfo.pool_name);
  await context.mainPage.setSegment(poolInfo.segment_id);
  await context.mainPage.setPlacementType(poolInfo.placement_id);
  await context.mainPage.setJobDescription(poolInfo.job_description);
  await context.mainPage.setInternalOrderInfo(poolInfo.internal_order_info);
  await context.mainPage.setAccountManager(poolInfo.agent_id_create);
  await context.mainPage.setAssistedBy(poolInfo.assisted_by_id);
  await context.mainPage.setAccountManager(poolInfo.account_manager_id);
  await context.mainPage.click('submit_button');

  // expect(context.mainPage).toBeInstanceOf('TalentPoolViewActionScreen');
  await context.mainPage.switchTab('summary');
  const headlineText = await context.mainPage.find('pool_headline').textContent();
  return headlineText.split('-').pop().trim();
}

/**
 * Gets the contact ID by searching contact last name.
 * Intended for use with contact last names that return one result.
 *
 * @param {string} contactLastName
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The contact ID
 */
async function getContactId(contactLastName, page, context) {
  await context.topPage.openModule('contact');
  await context.mainPage.runQuickSearch(contactLastName);
  await context.mainPage.selectRowNumber(1);
  await context.mainPage.clickAsaba('AWUIDrawViewContactDetail');
  // expect(context.mainPage).toBeInstanceOf('ContactViewDetail');
  const contactId = await context.mainPage.getContactId();
  return String(contactId);
}

/**
 * Enters financial info on the financial info tab.
 * clear_and_type does not function the same in these financial fields,
 * so we use the type_financial_value method.
 *
 * @param {Object} financialInfo - Field-to-value mapping
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and feature flags
 */
async function enterFinancialInfo(financialInfo, page, context) {
  context.orderQualityFeature = await context.readFeature('order-quality-2023');
  context.applicantPayTransparencyFeature = await context.readFeature('applicant-pay-transparency');
  await context.mainPage.switchTab('financial_info');

  // Add default values for minimum and maximum pay rates if they don't exist and feature is enabled
  if (context.applicantPayTransparencyFeature) {
    if (financialInfo.minimum_pay_rate === undefined) {
      financialInfo.minimum_pay_rate = 22.50;
    }
    if (financialInfo.maximum_pay_rate === undefined) {
      financialInfo.maximum_pay_rate = 24.00;
    }
  }

  for (const [selector, value] of Object.entries(financialInfo)) {
    switch (selector) {
      case 'rate_type':
        await context.mainPage.setField('rate_type', value);
        break;
      case 'exclusive':
        if (context.orderQualityFeature) {
          await context.mainPage.findSelect('financial_info', 'exclusive').selectByValue(value);
        }
        break;
      case 'direct':
        if (context.orderQualityFeature) {
          await context.mainPage.findSelect('financial_info', 'direct').selectByValue(value);
        }
        break;
      case 'maximum_pay_rate':
        if (context.applicantPayTransparencyFeature) {
          await context.mainPage.setField('maximum_pay_rate', value);
        }
        break;
      case 'minimum_pay_rate':
        if (context.applicantPayTransparencyFeature) {
          await context.mainPage.setField('minimum_pay_rate', value);
        }
        break;
      default:
        await context.mainPage.typeFinancialValue(value, selector);
        break;
    }
  }

  // Take care of submittal range if needed
  await context.mainPage.setSubmittalRangeType();
}

/**
 * Creates a NY Marvel Cartoon test order with posting from DB.
 */
async function createNewNyMarvelCartoonTestOrderWithPostingFromDb(user = null, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createOrderWithPostingSql(data.new_york_sql_post, user, context.config);
}

/**
 * Creates a NY Marvel Cartoon test order without posting from DB.
 */
async function createNewNyMarvelCartoonTestOrderWithoutPostingFromDb(user = null, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createOrderWithoutPostingSql(data.new_york_sql, user, context.config);
}

/**
 * Creates a NY Marvel Cartoon test order via UI.
 */
async function createNewNyMarvelCartoonTestOrder(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.new_york, false, data, page, context);
}

/**
 * Creates a NY Marvel Cartoon test order with posting via UI.
 */
async function createNewNyMarvelCartoonTestOrderWithPosting(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.new_york, true, data, page, context);
}

/**
 * Creates a London Google UK Limited order via UI.
 */
async function createNewLondonGoogleUkLimitedOrder(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.london, false, data, page, context);
}

/**
 * Creates a London Google UK Limited order via SQL.
 */
async function createNewLondonGoogleUkLimitedOrderInSql(context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createOrderWithoutPostingSql(data.london_sql, null, context.config);
}

/**
 * Creates a London order with talent paid via umbrella company via UI.
 */
async function createLondonOrderWithTalentPaidViaUmbrellaCompany(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.london_with_umbrella_talent_pay, false, data, page, context);
}

/**
 * Creates a London order with talent paid via umbrella company via SQL.
 */
async function createLondonOrderWithTalentPaidViaUmbrellaCompanyInSql(context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createOrderWithoutPostingSql(data.london_with_umbrella_talent_pay_sql, null, context.config);
}

/**
 * Creates a Melbourne order via UI.
 */
async function createNewMelbourneOrder(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.melbourne, false, data, page, context);
}

/**
 * Creates a Melbourne order via SQL.
 */
async function createNewMelbourneOrderInSql(context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createOrderWithPostingSql(data.melbourne_sql, null, context.config);
}

/**
 * Creates a Tokyo order via UI.
 */
async function createNewTokyoOrder(page, context) {
  const data = loadData('data/yaml/utils/order_util.yaml');
  return await createNewOrderForMarket(data.tokyo, false, data, page, context);
}

/**
 * DEPRECATED: Use createNewOrder instead.
 * Creates a new order for a given market.
 *
 * @param {Object} market - Market data
 * @param {boolean} createPosting - Whether to create a job posting
 * @param {Object} data - Additional data
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @returns {Promise<string>} The order ID
 */
async function createNewOrderForMarket(market, createPosting, data, page, context) {
  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency', 'auto-practice-generator']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];
  context.autoPracticeGeneratorFeature = features['auto-practice-generator'];

  const tempData = data || context.data;
  // expect(context.topPage).toBeInstanceOf('Frameset');

  await context.topPage.openModule('order');
  // expect(context.mainPage).toBeInstanceOf('ListScreen');

  await context.mainPage.clickAsaba('AWUIDrawEnterNewOrder');
  // expect(context.mainPage).toBeInstanceOf('EnterNewOrder');

  await context.mainPage.findSelect('fields', 'market_select').selectByValue(market.market.value);
  await context.mainPage.setClientName(market.client.partial_name);
  await context.mainPage.clickAsaba('selectClient');
  await page.waitForTimeout(3000);
  // expect(context.mainPage).toBeInstanceOf('OrderDrawNewOrderFromClient');

  if (tempData.onboarding_complete === true) {
    await context.mainPage.setOnboardingComplete(true);
  }

  await context.mainPage.setField('bill_to', market.contact.id);
  await context.mainPage.setField('ordered_by', market.contact.id);
  await context.mainPage.setField('report_to', market.contact.id);
  await context.mainPage.setField('off_site_preference', tempData.off_site_preference.value);
  await context.mainPage.setField('order_status', market.order_status.value);

  // Set practice info
  if (context.autoPracticeGeneratorFeature) {
    await setPracticeSelect2(tempData.minor_segment.name, page, context);
  } else {
    await context.mainPage.setMinorSegment('TECH_Software_Developer');
  }

  await context.mainPage.setField('reason_created', tempData.reason_created.value);
  await context.mainPage.setField('how_heard', tempData.how_heard.value);
  await context.mainPage.addOrderCredit(tempData.order_credit.name, tempData.order_credit.id, '100');

  await context.mainPage.switchTab('financial_info');
  await context.mainPage.findSelect('financial_info', 'exclusive').selectByValue(market.financial_info.exclusive);
  await context.mainPage.findSelect('financial_info', 'direct').selectByValue(market.financial_info.direct);

  if (context.applicantPayTransparencyFeature) {
    await context.mainPage.setMaximumPayRate();
    await context.mainPage.setMinimumPayRate();
    await context.mainPage.setSubmittalRangeType();
  }

  await context.mainPage.switchTab('summary');

  if (market.market.name === 'Tokyo') {
    await context.mainPage.setField('boss_of_report_to', market.contact.id);
    await context.mainPage.setField('contract_contact', market.contact.id);
    await context.mainPage.setField('claims_contact', market.contact.id);
    await context.mainPage.setField('labor_department_category', market.labor_department.value);
    await context.mainPage.switchTab('financial_info');
    await context.mainPage.setField('pay_frequency', market.pay_frequency.value);
    await context.mainPage.findSelect('financial_info', 'exclusive').selectByValue('1');
    await context.mainPage.findSelect('financial_info', 'direct').selectByValue('1');
    await context.mainPage.switchTab('summary');
  }

  if (market.start_date) {
    let startDate;
    if (market.start_date === 'today') {
      startDate = new Date();
    } else {
      startDate = new Date(market.start_date);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + market.end_date_days);

    const formatDate = (d) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    };

    await context.mainPage.setStartDate(formatDate(startDate));
    await context.mainPage.setEndDate(formatDate(endDate));
  }

  if (market.placement_type) {
    await context.mainPage.findSelect('summary', 'placement_type').selectByValue(market.placement_type.value);
  }

  if (market.talent_paid_via_umbrella_company) {
    await context.mainPage.setField('paid_by_umbrella_company_checkbox', market.talent_paid_via_umbrella_company.value_yes);
  }

  await context.mainPage.setOnboardingNotes();
  const onboardingExists =
    await context.mainPage.exists('summary', 'onboarding_complete') ||
    await context.mainPage.exists('summary', 'us_can_onboarding_complete');
  if (onboardingExists) {
    await context.mainPage.setOnboardingComplete(true);
  }

  await context.mainPage.switchTab('position_description');
  const testTimestamp = new Date().toISOString().replace(/[T:]/g, '.').slice(2, 22);
  await context.mainPage.clearAndType('Auto New Order Title ' + testTimestamp, 'position_description', 'position_title');
  await context.mainPage.clearAndType('Test Automation Internal Order Info ' + testTimestamp, 'position_description', 'internal_order_info');
  await context.mainPage.setOrderIntakeStatusDropdown();

  await context.mainPage.submitSave();
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

  const orderName = await context.mainPage.find('order_name').textContent();
  const orderId = orderName.split(' - ')[2];

  if (createPosting) {
    await context.mainPage.clickAsaba('AWUIDrawNewPostingScreen');
    // expect(context.mainPage).toBeInstanceOf('JobPostingEnterNew');
    await createPostingForMarket(tempData.order_related_job_posting.new_york, false, page, context);
    await context.topPage.openModule('order');
    await context.mainPage.runQuickSearch(orderId);
    // expect(context.resultsPage).toBeInstanceOf('OrderSearchResults');
    await context.resultsPage.selectRowNumber(1);
    await context.mainPage.clickAsaba('AWUIDrawViewOrderDetail');
    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
  }

  return orderId;
}

/**
 * Creates a child order from a duplicate order.
 *
 * @param {string} orderId - Parent order ID
 * @param {Date} parentStartDate
 * @param {Date} parentEndDate
 * @param {Date} parentCreateDate
 * @param {Object|null} readyTalent - Talent data, defaults to context.data.ready_talent
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, data, and helpers
 * @returns {Promise<string>} The child order ID
 */
async function createChildOrder(orderId, parentStartDate, parentEndDate, parentCreateDate, readyTalent = null, page, context) {
  const { expect } = require('@playwright/test');

  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];

  readyTalent = readyTalent || context.data.ready_talent;
  // expect(context.mainPage).toBeInstanceOf('OrderDuplicateEditDetail');

  const formatDate = (d) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const formatDisplayDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
  };

  const orderStatusText = await context.mainPage.find('summary', 'order_status').textContent();
  expect(orderStatusText).toBe(context.data.order_status.filled);

  const startDateValue = await context.mainPage.find('summary', 'start_date').inputValue();
  const startDate1 = formatDate(parentStartDate);
  const nextDay = new Date(parentStartDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const startDate2 = formatDate(nextDay);
  expect([startDate1, startDate2]).toContain(startDateValue);

  const endDateValue = await context.mainPage.find('summary', 'end_date').inputValue();
  expect(endDateValue).toBe(formatDate(parentEndDate));

  const parentOrderIdText = await context.mainPage.find('summary', 'parent_order_id').textContent();
  expect(parentOrderIdText).toBe(orderId);

  const createDateText = await context.mainPage.find('summary', 'create_date').textContent();
  const createDate1 = formatDate(parentCreateDate);
  const createNextDay = new Date(parentCreateDate);
  createNextDay.setDate(createNextDay.getDate() + 1);
  const createDate2 = formatDate(createNextDay);
  expect([createDate1, createDate2]).toContain(createDateText);

  await context.mainPage.addOrderCredit(context.data.credit_agent.name, context.data.credit_agent.id, 100);
  await context.mainPage.setEndDateStatus(2); // Pending Extension

  await context.mainPage.setOnboardingNotes();
  await context.mainPage.setOnboardingComplete(true);

  if (context.orderIntakeStatusFeature) {
    await context.mainPage.setOrderIntakeStatusDropdown();
  }
  if (context.applicantPayTransparencyFeature) {
    await context.mainPage.setMaximumPayRate();
    await context.mainPage.setMinimumPayRate();
    await context.mainPage.setSubmittalRangeType();
  }

  await context.mainPage.switchTab('summary');
  await context.mainPage.clickSaveButton();

  let filledPendingOnboarding = false;
  if (await context.mainPage.isInstanceOf('OrderSubmitDuplicate')) {
    await context.mainPage.clickAsaba('provisionalDuplicateOrder');
    filledPendingOnboarding = true;
  }

  await page.waitForTimeout(5000);
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

  const parentOrderIdResult = await context.mainPage.find('summary', 'parent_order_id').textContent();
  const childOrderId = await context.mainPage.find('summary', 'order_id').textContent();

  if (filledPendingOnboarding) {
    const statusText = await context.mainPage.find('summary', 'order_status').textContent();
    expect(statusText).toBe(context.data.order_status.filled_pending);
  } else {
    const statusText = await context.mainPage.find('summary', 'order_status').textContent();
    expect(statusText).toBe(context.data.order_status.filled);
  }

  const createDateDisplay = await context.mainPage.find('summary', 'create_date').textContent();
  expect(createDateDisplay).toBe(formatDisplayDate(parentCreateDate));
  expect(parentOrderIdResult).toBe(orderId);

  await context.mainPage.clickAsaba('AWUIDrawManageCandidates');
  // expect(context.mainPage).toBeInstanceOf('ManageCandidates');
  const payRateText = await context.mainPage.find('pay_rate').textContent();
  expect(payRateText).toBe(context.data.pay_rate);
  // expect(context.currentCandidates).toBeInstanceOf('CurrentCandidates');

  if (filledPendingOnboarding) {
    const row1 = await context.currentCandidates.getContentForRowNumberByHeader(1);
    expect(row1['First Name']).toBe(readyTalent.first_name);
    expect(row1['Last Name']).toBe(readyTalent.last_name);
    expect(row1['Candidate Status']).toBe(readyTalent.candidate_status);

    await context.mainPage.clickAsaba('AWUIDrawViewOrderDetail');
    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
    await context.mainPage.click('summary', 'parent_order_id');

    // New window context (index 1)
    // expect(context.mainPage(1)).toBeInstanceOf('OrderViewDetail');
    const parentIdText = await context.mainPage(1).find('summary', 'order_id').textContent();
    expect(parentIdText).toBe(parentOrderIdResult);
    const placedText = await context.mainPage(1).find('summary', 'number_of_candidates_placed').textContent();
    expect(placedText).toBe(context.data.number_of_candidates_placed);
    const childOrdersText = await context.mainPage(1).find('summary', 'child_orders').textContent();
    expect(childOrdersText).toContain(childOrderId);

    await context.mainPage(1).clickAsaba('AWUIDrawManageCandidates');
    // expect(context.mainPage(1)).toBeInstanceOf('ManageCandidates');
    // expect(context.currentCandidates(1)).toBeInstanceOf('CurrentCandidates');

    const row1Parent = await context.currentCandidates(1).getContentForRowNumberByHeader(1);
    expect(row1Parent['First Name']).toBe(readyTalent.first_name);
    expect(row1Parent['Last Name']).toBe(readyTalent.last_name);
    expect(row1Parent['Candidate Status']).toBe(readyTalent.candidate_status);

    const payRateParent = await context.mainPage(1).find('pay_rate').textContent();
    expect(payRateParent).toBe(context.data.pay_rate);
  }

  return childOrderId;
}

/**
 * Duplicates an order based on configuration.
 *
 * @param {Object} order - Order duplication configuration
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 */
async function duplicateAsOrder(order, page, context) {
  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];

  let modal;
  if (order.is_talent_pool) {
    modal = await context.mainPage.openDuplicatePool();
  } else {
    modal = await context.mainPage.openDuplicateOrder();
  }

  // expect(modal).toBeInstanceOf('DuplicateOrderDialog');
  if (order.duplicate_reason === 'net new position') {
    await modal.setDuplicateReason('net_new_position');
  } else {
    await modal.setDuplicateReason('administrative_change');
  }

  if (await modal.displayed('fill_with_same_talent', 'control_group')) {
    await modal.setFillWithSameTalent(order.fill_with_same_talent);
  }

  if (await modal.displayed('keep_custom_field_values', 'control_group')) {
    await modal.setKeepCustomFieldValues(false);
  }

  await modal.setCopyTalentToNewOrder(order.copy_talent_to_new_order);
  await modal.duplicateAsOrder();
  await modal.submit();

  if (order.complete_dupe) {
    // expect(context.mainPage).toBeInstanceOf('OrderDuplicateEditDetail');
    if (context.orderIntakeStatusFeature) {
      await context.mainPage.setOrderIntakeStatusDropdown();
    }
    if (context.applicantPayTransparencyFeature) {
      await context.mainPage.setMaximumPayRate();
      await context.mainPage.setMinimumPayRate();
      await context.mainPage.setSubmittalRangeType();
    }
    await context.mainPage.completeDuplicateOrderEdit(order);
  }
}

/**
 * Sets up a duplicate order from yaml data.
 *
 * @param {Object} order - Order data with id, start_date, end_date_days, etc.
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, data, timestamp, and helpers
 */
async function setUpDuplicateOrder(order, page, context) {
  const features = await context.readFeaturesBatch(['order-intake-status', 'applicant-pay-transparency']);
  context.orderIntakeStatusFeature = features['order-intake-status'];
  context.applicantPayTransparencyFeature = features['applicant-pay-transparency'];

  await context.visitAndLogin(page);
  // expect(context.topPage).toBeInstanceOf('Frameset');

  await context.topPage.openModule('order');
  // expect(context.mainPage).toBeInstanceOf('ListScreen');
  await context.mainPage.runQuickSearch(order.id);

  await context.resultsPage.selectRowNumber(1);
  await context.mainPage.clickAsaba('AWUIDrawViewOrderDetail');

  const modal = await context.mainPage.openDuplicateOrder();
  // expect(modal).toBeInstanceOf('DuplicateOrderDialog');
  await modal.setDuplicateReason('administrative_change');

  if (await modal.displayed('fill_with_same_talent', 'control_group')) {
    await modal.setFillWithSameTalent(order.fill_with_same_talent);
  }
  if (await modal.displayed('keep_custom_field_values', 'control_group')) {
    await modal.setKeepCustomFieldValues(false);
  }
  await modal.setCopyTalentToNewOrder(order.copy_talent_to_new_order);
  await modal.duplicateAsOrder();
  await modal.submit();

  // expect(context.mainPage).toBeInstanceOf('OrderDuplicateEditDetail');
  await context.mainPage.switchTab('summary');

  const startDate = new Date(order.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + order.end_date_days);
  await context.mainPage.setStartDate(startDate);
  await context.mainPage.setEndDate(endDate);

  await context.mainPage.setAccountManager(order.account_manager);
  await context.mainPage.findSelect('summary', 'how_heard').selectByValue(order.how_heard.value);
  const creditAgent = order.credit_agent;
  await context.mainPage.addOrderCredit(creditAgent.name, creditAgent.id, 100);

  await context.mainPage.switchTab('financial_info');
  await context.mainPage.findSelect('financial_info', 'exclusive').selectByValue(order.exclusive);
  await context.mainPage.findSelect('financial_info', 'direct').selectByValue(order.direct);

  if (context.applicantPayTransparencyFeature) {
    await context.mainPage.setMaximumPayRate();
    await context.mainPage.setMinimumPayRate();
    await context.mainPage.setSubmittalRangeType();
  }

  // Change position description to test name with unique timestamp
  await context.mainPage.switchTab('position_description');
  const jobTitle = context.data.duplicate_order.position_title + context.timestamp;
  await context.mainPage.setField('position_title', jobTitle);
  await context.mainPage.setField('mat_job_title', jobTitle);

  if (context.orderIntakeStatusFeature) {
    await context.mainPage.setOrderIntakeStatusDropdown();
  }
  await context.mainPage.clickSaveButton();

  if (order.requires_onboarding) {
    // expect(context.mainPage).toBeInstanceOf('OrderSubmitDuplicate');
    await context.mainPage.clickAsaba('provisionalDuplicateOrder');
  }
}

/**
 * Creates a multiple openings order via UI.
 *
 * @param {number} num - Number of openings
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and data
 * @returns {Promise<string>} The order ID
 */
async function createMultipleOpeningsOrder(num, page, context) {
  await context.visitAndLogin(page);
  await context.mainPage.checkTalentSetReadyToWork(context.data.set_gail_mastrone_rtw.id);

  // Create baseline order
  const orderId = await createNewOrderForMarket(context.data.client_with_onboarding, false, context.data, page, context);
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');

  // Turn into a multiple placement order
  await context.mainPage.clickAsaba('AWUIDrawEditOrderDetail');
  // expect(context.mainPage).toBeInstanceOf('OrderEditDetail');
  await context.mainPage.setNumberOfOpenings(num);
  await context.mainPage.setOnboardingNotes();
  await context.mainPage.switchTab('financial_info');
  await context.mainPage.doubleClick('financial_info', 'regular_pay_rate');
  await context.mainPage.type(12, 'financial_info', 'regular_pay_rate');
  await context.mainPage.switchTab('summary');
  await context.mainPage.submitSave();
  return orderId;
}

/**
 * Creates a multiple openings order via SQL.
 *
 * @param {number} num - Number of openings
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and data
 * @returns {Promise<string>} The order ID
 */
async function createMultipleOpeningsOrderInSql(num, page, context) {
  await context.visitAndLogin(page);
  await context.mainPage.checkTalentSetReadyToWork(context.data.set_gail_mastrone_rtw.id);

  const orderData = context.data.client_with_onboarding_sql;
  orderData.number_of_openings = num;

  const orderId = await createOrderWithPostingInDb(orderData, null, context);
  await openOrder(orderId, page, context);
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
  return orderId;
}

/**
 * Submits a modal and dismisses any alert.
 *
 * @param {Object} modal - The modal page object
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The alert text
 */
async function submitModalAndDismissAlert(modal, context) {
  await modal.click('submit_button');
  await checkAndDismissAutoRejectionEmailModal(context);
  const alertText = await context.sweetAlert2Modal.getContent();
  await context.sweetAlert2Modal.confirm();
  return alertText;
}

/**
 * Checks for and dismisses the auto rejection email modal if present.
 *
 * @param {Object} context - Object containing page objects
 */
async function checkAndDismissAutoRejectionEmailModal(context) {
  try {
    const modal = context.sweetAlert2Modal;
    if (modal) {
      const modalText = await modal.getText();
      if (modalText === 'Would you like to send automatic rejection emails?') {
        await modal.cancel();
      }
    }
  } catch {
    // No modal is present; safely ignore
  }
}

/**
 * Checks if the order activity history includes a given activity type.
 *
 * @param {string} textInTypeColumn - Expected text in the Activity Type column
 * @param {Object} context - Object containing page objects
 * @returns {Promise<boolean>}
 */
async function orderActivityHistoryIncludes(textInTypeColumn, context) {
  // expect(context.activityHistoryPageOrder).toBeInstanceOf('ActivityHistory');
  const activityCount = await context.activityHistoryPageOrder.getRowCount();
  let activityFound = false;

  for (let rowNumber = 1; rowNumber <= activityCount; rowNumber++) {
    const rowContent = await context.activityHistoryPageOrder.getContentForRowNumberByHeader(rowNumber);
    if (rowContent['Activity Type'] === textInTypeColumn) {
      activityFound = true;
      break;
    }
  }

  return activityFound;
}

/**
 * Completes onboarding and fills an order.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function completeOnboardingAndFillOrder(page, context) {
  const isOrderMissingInfo = await context.mainPage.isInstanceOf('OrderMissingInfo');
  const isOrderSubmitDuplicate = await context.mainPage.isInstanceOf('OrderSubmitDuplicate');

  if (isOrderMissingInfo || isOrderSubmitDuplicate) {
    if (isOrderMissingInfo) {
      await context.mainPage.clickAsaba('provisionalQuickFill');
    }
    if (isOrderSubmitDuplicate) {
      await context.mainPage.clickAsaba('provisionalDuplicateOrder');
    }

    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
    await context.mainPage.clickAsaba('AWUIDrawEditOrderDetail');
    // expect(context.mainPage).toBeInstanceOf('OrderEditDetail');
    await context.mainPage.setOnboardingComplete(true);
    await context.mainPage.clickAsaba('completeFill');
    const quickFillModal = await context.mainPage.findQuickFill();
    await quickFillModal.submit();
    await checkAndDismissAutoRejectionEmailModal(context);
  }
}

/**
 * Changes a candidate's status on an order.
 *
 * @param {string} orderId - The order ID
 * @param {string} talentId - The talent/person ID
 * @param {string} status - The new candidate status
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function changeCandidateStatus(orderId, talentId, status, page, context) {
  await context.topPage.openModule('order');
  await context.mainPage.runQuickSearch(orderId);
  await context.resultsPage.selectRowNumber(1);
  await context.mainPage.clickAsaba('AWUIDrawManageCandidates');
  // expect(context.mainPage).toBeInstanceOf('ManageCandidates');
  await context.mainPage.runQuickSearch(talentId);

  // expect(context.possibleCandidates).toBeInstanceOf('PossibleCandidates');
  await context.possibleCandidates.selectRow(talentId);

  await context.mainPage.clickAsaba('makeCandidate');
  // expect(context.mainPage).toBeInstanceOf('ChangeCandidateStatus');
  await context.mainPage.selectCandidateStatusType(status);
  await context.mainPage.clickNextButton();
}

/**
 * Checks order status and changes it to 'New' if needed.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function checkAndChangeOrderStatusToNew(page, context) {
  const orderStatus = await context.mainPage.find('summary', 'order_status').textContent();

  if (orderStatus !== 'New') {
    await context.mainPage.edit();
    // expect(context.mainPage).toBeInstanceOf('OrderEditDetail');
    await context.mainPage.switchTab('financial_info');

    const exclusiveVal = await context.mainPage.find('financial_info', 'exclusive').inputValue();
    const directVal = await context.mainPage.find('financial_info', 'direct').inputValue();

    if (parseInt(exclusiveVal, 10) < 1 || parseInt(directVal, 10) < 1) {
      await context.mainPage.findSelect('financial_info', 'exclusive').selectByValue('1');
      await context.mainPage.findSelect('financial_info', 'direct').selectByValue('1');
    }

    await context.mainPage.switchTab('summary');
    await context.mainPage.setStatus('new');

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);
    await context.mainPage.setStartDate(today);
    await context.mainPage.setEndDate(endDate);
    await context.mainPage.setOrderIntakeStatusDropdown();
    await context.mainPage.setMinimumPayRate();
    await context.mainPage.setMaximumPayRate();
    await context.mainPage.saveAcceptAlert();
    // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
  }
}

/**
 * Set minor segment by segment title using Select2. Sets default if no data passed.
 *
 * @param {string|null} content - Segment title string
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function setPracticeSelect2(content = null, page, context) {
  content = content || 'CRE - Creative Director';
  await context.mainPage.switchTab('position_description');
  const select = await context.mainPage.find('position_description', 'minor_segment_select2');
  await select.fill(content);
  await select.locator('.select2-result').first().click();
}

/**
 * Set minor segment by id. Sets default if no data passed.
 *
 * @param {string|null} minorSegment - Numeric string
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function setMinorSegment(minorSegment = null, page, context) {
  minorSegment = minorSegment || '88';
  await context.mainPage.switchTab('position_description');
  await context.mainPage.findSelect('position_description', 'minor_segment').selectByValue(minorSegment);
}

/**
 * Sets segment field based on feature flag value.
 *
 * @param {string|null} content - Segment title string
 * @param {string|null} minorSegment - Numeric string
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 */
async function setSegment(content = null, minorSegment = null, page, context) {
  context.autoPracticeGeneratorFeature = await context.readFeature('auto-practice-generator');
  if (context.autoPracticeGeneratorFeature) {
    await context.mainPage.setPracticeSelect2(content);
  } else {
    await context.mainPage.setMinorSegment(minorSegment);
  }
}

/**
 * Configures candidate column preferences in CloudWall user prefs.
 *
 * @param {string} pref - Preference type: 'auto gather', 'lro', or '' (default)
 * @param {string|null} loginUser - User to log in as
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, helpers, and CANDIDATE_COLUMN_OPTS
 */
async function configureCandidateColumnPreferences(pref = '', loginUser = null, page, context) {
  if (!(await context.topPage.isInstanceOf('Frameset'))) {
    if (loginUser) {
      await context.visitAndLoginAs(page, loginUser);
    } else {
      console.log('ATTENTION: No login user specified, changing the candidate column preferences of the default test user!');
      await context.visitAndLogin(page);
    }
  }

  await page.waitForTimeout(1000);
  await context.searchTopPage.click('cloudwall_preferences');
  await page.waitForTimeout(3000);
  // expect(context.mainPage).toBeInstanceOf('CloudWallUserPrefs');
  await context.mainPage.switchTab('candidates');

  const canCol = context.CANDIDATE_COLUMN_OPTS;
  const canColOptions = await context.mainPage.findSelect('candidates', 'options_list');
  const canColSelected = await context.mainPage.findSelect('candidates', 'selected_list');

  // Reset columns
  await canColSelected.selectAll();
  await canColSelected.deselect(canCol.candidate_status);
  await context.mainPage.find('candidates', 'left_button').click();

  switch (pref) {
    case 'auto gather':
      await canColOptions.select(canCol.first_name);
      await context.mainPage.click('candidates', 'right_button');
      await canColSelected.select(canCol.first_name);
      await context.mainPage.click('candidates', 'up_button');
      await canColOptions.select(canCol.last_name);
      await context.mainPage.click('candidates', 'right_button');
      await canColSelected.select(canCol.last_name);
      await context.mainPage.click('candidates', 'up_button');
      await canColOptions.select(canCol.smartphone_email);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.preferred_email);
      await context.mainPage.click('candidates', 'right_button');
      break;

    case 'lro':
      await canColOptions.select(canCol.sourcing_provider);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.score);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.person_id);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.sourced_by);
      await context.mainPage.click('candidates', 'right_button');
      break;

    default:
      await canColOptions.select(canCol.person_code);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.review_rating);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.availability);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.last_availability_update);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.score);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.talent_star);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.person_id);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.first_name);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.last_name);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.professional_headline);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.market);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.status);
      await context.mainPage.click('candidates', 'right_button');
      await canColOptions.select(canCol.talent_address);
      await context.mainPage.click('candidates', 'right_button');

      await canColSelected.select(canCol.candidate_status);
      for (let i = 0; i < 11; i++) {
        await context.mainPage.click('candidates', 'down_button');
      }
      break;
  }

  await context.topPage.hideAllNotifications();
  await context.mainPage.submitSave();
}

/**
 * Configures candidate search preferences in CloudWall user prefs.
 *
 * @param {string} pref - Preference type (currently unused, reserved for future)
 * @param {string|null} loginUser - User to log in as
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, helpers, and CANDIDATE_SEARCH_COLUMN_OPTS
 */
async function configureCandidateSearchPreferences(pref = '', loginUser = null, page, context) {
  if (!(await context.topPage.isInstanceOf('Frameset'))) {
    if (loginUser) {
      await context.visitAndLoginAs(page, loginUser);
    } else {
      console.log('ATTENTION: No login user specified, changing the candidate search preferences of the default test user!');
      await context.visitAndLogin(page);
    }
  }

  await page.waitForTimeout(1000);
  await context.driver.updateFrames();
  await context.searchTopPage.click('cloudwall_preferences');
  await page.waitForTimeout(3000);
  // expect(context.mainPage).toBeInstanceOf('CloudWallUserPrefs');
  await context.mainPage.switchTab('candidates');

  const canSearchCol = context.CANDIDATE_SEARCH_COLUMN_OPTS;
  const canSearchColOptions = await context.mainPage.findSelect('possible_candidates', 'options_list');
  const canSearchColSelected = await context.mainPage.findSelect('possible_candidates', 'selected_list');

  // Reset person_code placement
  await canSearchColSelected.selectAll();
  await canSearchColSelected.deselect(canSearchCol.source);
  await canSearchColSelected.deselect(canSearchCol.email);
  await context.mainPage.find('possible_candidates', 'left_button').click();

  // Match columns sequence in COLUMNS in possible_candidates
  await canSearchColOptions.select(canSearchCol.talent_star);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.last_updated);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.first_name);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.last_name);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.professional_headline);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.market);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.temp);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.perm);
  await context.mainPage.click('possible_candidates', 'right_button');
  await canSearchColOptions.select(canSearchCol.person_id);
  await context.mainPage.click('possible_candidates', 'right_button');

  await canSearchColSelected.select(canSearchCol.source);
  for (let i = 0; i < 3; i++) {
    await context.mainPage.click('possible_candidates', 'down_button');
  }

  await canSearchColSelected.select(canSearchCol.email);
  for (let i = 0; i < 9; i++) {
    await context.mainPage.click('possible_candidates', 'down_button');
  }

  await context.topPage.hideAllNotifications();
  await context.mainPage.submitSave();
}

/**
 * Switches to the job tracker widget iframe.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function switchToJobTrackerWidgetFrame(page, context) {
  const frame = await context.mainPage.find('job_tracker_widget', 'frame');
  await context.mainPage.switchToIframe(frame);
  // Wait until chip_set is displayed
  await context.mainPage.waitForDisplayed('job_tracker_widget', 'chip_set');
}

/**
 * Opens an order by ID.
 *
 * @param {string} orderId - The order ID
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The order ID
 */
async function openOrder(orderId, page, context) {
  // expect(context.topPage).toBeInstanceOf('Frameset');

  await context.topPage.openModule('order');
  await page.waitForTimeout(3000);
  // expect(context.mainPage).toBeInstanceOf('ListScreen');
  await context.mainPage.runQuickSearch(orderId);
  // expect(context.resultsPage).toBeInstanceOf('OrderSearchResults');
  const rowCount = await context.resultsPage.getRowCount();
  expect(rowCount).not.toBeNull();
  await context.resultsPage.selectRowNumber(1);
  await context.mainPage.clickAsaba('AWUIDrawViewOrderDetail');
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
  return orderId;
}

module.exports = {
  createOrderWithoutPostingInDb,
  createOrderWithPostingInDb,
  createNewOrder,
  createOrder,
  createTalentPool,
  getContactId,
  enterFinancialInfo,
  createNewNyMarvelCartoonTestOrderWithPostingFromDb,
  createNewNyMarvelCartoonTestOrderWithoutPostingFromDb,
  createNewNyMarvelCartoonTestOrder,
  createNewNyMarvelCartoonTestOrderWithPosting,
  createNewLondonGoogleUkLimitedOrder,
  createNewLondonGoogleUkLimitedOrderInSql,
  createLondonOrderWithTalentPaidViaUmbrellaCompany,
  createLondonOrderWithTalentPaidViaUmbrellaCompanyInSql,
  createNewMelbourneOrder,
  createNewMelbourneOrderInSql,
  createNewTokyoOrder,
  createNewOrderForMarket,
  createChildOrder,
  duplicateAsOrder,
  setUpDuplicateOrder,
  createMultipleOpeningsOrder,
  createMultipleOpeningsOrderInSql,
  submitModalAndDismissAlert,
  checkAndDismissAutoRejectionEmailModal,
  orderActivityHistoryIncludes,
  completeOnboardingAndFillOrder,
  changeCandidateStatus,
  checkAndChangeOrderStatusToNew,
  setPracticeSelect2,
  setMinorSegment,
  setSegment,
  configureCandidateColumnPreferences,
  configureCandidateSearchPreferences,
  switchToJobTrackerWidgetFrame,
  openOrder,
};
