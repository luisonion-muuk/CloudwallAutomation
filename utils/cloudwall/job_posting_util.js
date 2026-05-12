// job_posting_util.js

const { expect } = require('@playwright/test');

/**
 * Sets up a job posting for a given market. Fills in fields on the posting form.
 *
 * @param {Object} market - Market data object with agent, market, job_location, placement_type, etc.
 * @param {boolean} toggleOrderAssisted - Whether to toggle the assisted-by checkbox
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects (mainPage, data, jobTitle, jobDescription, etc.)
 * @returns {Promise<string|null>} Order ID, or null
 */
async function setupJobPostingForMarket(market, toggleOrderAssisted, page, context) {
  const timestamp = new Date().toISOString().replace(/[T:]/g, '.').slice(2, 22);

  let agentName, agentId;
  if (context.data && context.data.agent) {
    agentName = context.data.agent.name;
    agentId = context.data.agent.id;
  } else if (market.agent) {
    agentName = market.agent.name;
    agentId = market.agent.id;
  } else {
    // Set some default data
    agentName = 'Automation, Test';
    agentId = 1773265;
  }

  const agentResponsibleValue = await context.mainPage.find('agent_responsible').inputValue();
  if (agentResponsibleValue !== agentName) {
    await context.mainPage.selectAgentResponsible(agentName, agentId);
  }

  await context.mainPage.findSelect('market').selectByValue(market.market.value);
  await context.mainPage.findSelect('job_location').selectByValue(market.job_location.value);
  await context.mainPage.findSelect('placement_type').selectByValue(market.placement_type.value);

  if (toggleOrderAssisted) {
    await context.mainPage.click('assisted_by');
  }

  await context.mainPage.switchTab('posting_content');

  // Pay/salary rate field should be a free text field
  market.pay_salary_rate = market.pay_salary_rate || `$123,456.00 ${timestamp}`;
  market.job_title = market.job_title || `Automation Test Job Title ${timestamp}`;

  if (!context.jobTitle) {
    context.jobTitle = market.job_title;
  }

  await context.mainPage.clearAndType(context.jobTitle, 'job_title');
  await context.mainPage.type(market.job_location_posting, 'job_location_posting');

  // Once to focus the element and second time to input text
  if (!context.jobDescription) {
    context.jobDescription = market.job_description;
  }
  await context.mainPage.type(market.job_description, 'job_description');
  await context.mainPage.type(context.jobDescription, 'job_description');

  const payTransparencyFeature = await context.readFeatureUsingQuery('applicant-pay-transparency');
  const placementTypeValue = parseInt(market.placement_type.value, 10);
  const marketValue = parseInt(market.market.value, 10);

  if (!payTransparencyFeature && placementTypeValue === 2 && marketValue === 11) {
    // Permanent New York posting
    await context.mainPage.type(market.salary_min, 'salary_range_min');
    await context.mainPage.type(market.salary_max, 'salary_range_max');
  } else {
    await context.mainPage.type(market.pay_salary_rate, 'pay_salary_rate');
  }

  return await context.mainPage.getOrderId();
}

/**
 * Creates a new job posting depending on parameters.
 *
 * @param {Object} market - Market data object
 * @param {boolean} toggleOrderAssisted - Whether to toggle the assisted-by checkbox
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 */
async function createPostingForMarket(market, toggleOrderAssisted, page, context) {
  await setupJobPostingForMarket(market, toggleOrderAssisted, page, context);
  await context.mainPage.savePost();
}

/**
 * Creates a job posting with pre-interview questions.
 *
 * @param {Object} market - Market data object including question1_id, question2_id, custom_question
 * @param {boolean} toggleOrderAssisted - Whether to toggle the assisted-by checkbox
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @returns {Promise<string>} The order ID
 */
async function createJobPostingWithPreInterviewQuestions(market, toggleOrderAssisted, page, context) {
  const orderId = await setupJobPostingForMarket(market, toggleOrderAssisted, page, context);
  // expect(context.mainPage).toBeInstanceOf('JobPostingSelectOrder');

  await context.mainPage.switchTab('pre_interview_questions');
  const piqPage = await context.mainPage.preInterviewQuestionsPage();
  // expect(piqPage).toBeInstanceOf('JobPostingSelectPreInterviewQuestions');
  await piqPage.waitForPreInterviewToLoad();
  await piqPage.handleCookies();
  await piqPage.selectPreInterviewQuestion(market.question1_id);
  await piqPage.selectPreInterviewQuestion(market.question2_id);
  await piqPage.enterCustomPreInterviewQuestion(1, market.custom_question);

  await context.mainPage.savePost();
  return orderId;
}

/**
 * Searches for an order to attach the job posting to.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, data, and driver
 */
async function searchForOrder(page, context) {
  await context.mainPage.type(context.data.search_order.client_name, 'fields', 'client_name');
  await context.mainPage.findSelect('fields', 'market').selectByValue(context.data.search_order.market.value);
  await page.click('#link_getOrders > div');
  // expect(context.mainPage).toBeInstanceOf('JobPostingSelectOrder');

  // Switch to ClientsFrame and click the first row
  const clientsFrame = page.frame('ClientsFrame') || page.frameLocator('[name="ClientsFrame"]');
  await clientsFrame.locator('.rowClass1').click();

  // Switch back to mainFrame
  const mainFrame = page.frame('mainFrame') || page.frameLocator('[name="mainFrame"]');
  await context.mainPage.selectOrder();
  // expect(context.mainPage).toBeInstanceOf('JobPostingSelectOrder');
}

/**
 * Performs a new order search for the specified client and market.
 * No talent pools, new/inquiry status order only.
 * Filters out orders already posted and those with no recruiter.
 *
 * @param {Object} searchData - Search criteria with client_name and market.value
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 */
async function findOrderWithRecruiter(searchData, page, context) {
  await context.topPage.openModule('order');

  await context.searchTopPage.click('new_detail_search_button');
  // expect(context.mainPage).toBeInstanceOf('OrderDetailSearch');

  await context.mainPage.setClientName(searchData.client_name);
  await context.mainPage.setMarket(parseInt(searchData.market.value, 10));

  await context.mainPage.setTalentPool('no');
  await context.mainPage.setOrderStatus([1, 2]); // Inquiry, New

  // Add Recruiter column to search results
  await context.mainPage.switchTab('column_selection');
  const posted = 'com.aquent.aquentweb1_0.ui.arealist.column.OrderAreaListColumn.Posted';
  const recruiter = 'com.aquent.aquentweb1_0.ui.arealist.column.OrderAreaListColumn.AssistedBy';
  await context.mainPage.findSelect('search_columns', 'options_column').selectOptions([posted, recruiter]);

  const rightButtons = await context.mainPage.findAll('search_columns', 'right_button');
  await rightButtons[1].click();

  await context.mainPage.find('search_columns', 'execute_button').click();
  await context.waitForSearchComplete();
  // expect(context.resultsPage).toBeInstanceOf('OrderSearchResults');

  await context.resultsPage.filterBy('Posted', 'No', { type: 'checkbox' });
  await context.resultsPage.sortColumn('recruiter');
  await context.resultsPage.selectRowNumber(1);

  await context.mainPage.clickAsaba('AWUIDrawViewOrderDetail');
  // expect(context.mainPage).toBeInstanceOf('OrderViewDetail');
}

/**
 * Inputs a job description into the posting content tab.
 *
 * @param {string} text - The job description text
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function inputJobDescription(text, page, context) {
  await context.mainPage.switchTab('posting_content');

  // Once to focus the element and second time to input text.
  // Sometimes the iframe does not display before the typing starts.
  await context.mainPage.find('job_description', { timeout: 15000 });
  await context.mainPage.type(text, 'job_description');
  await context.mainPage.type(text, 'job_description');
}

/**
 * Adds pre-interview questions to a job posting.
 *
 * @param {string[]} questionIds - Array of question IDs to select
 * @param {number[]} customQuestionIds - Array of custom question slot IDs
 * @param {string} customQuestionText - Text for the custom question
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function addPreInterviewQuestions(questionIds, customQuestionIds, customQuestionText, page, context) {
  await context.mainPage.switchTab('pre_interview_questions');

  const piqPage = await context.mainPage.preInterviewQuestionsPage();
  await piqPage.waitForPreInterviewToLoad();

  for (const id of questionIds) {
    await piqPage.selectPreInterviewQuestion(id);
  }

  for (const id of customQuestionIds) {
    await piqPage.enterCustomPreInterviewQuestion(id, customQuestionText);
  }

  await context.mainPage.click('save_button');
  // expect(context.mainPage).toBeInstanceOf('JobPostingViewDetail');
}

/**
 * Transforms a YAML value to its string representation for SQL parameter building.
 * Handles booleans, numbers, and strings.
 *
 * @param {*} value - The YAML value to transform
 * @returns {string} The string representation
 */
function transformYaml(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (value === null || value === undefined) return '';
  return String(value);
}

module.exports = {
  setupJobPostingForMarket,
  createPostingForMarket,
  createJobPostingWithPreInterviewQuestions,
  searchForOrder,
  findOrderWithRecruiter,
  inputJobDescription,
  addPreInterviewQuestions,
  transformYaml,
};