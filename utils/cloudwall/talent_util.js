// talent_util.js

const { expect } = require('@playwright/test');
const cheerio = require('cheerio');
const { queryDatabase } = require('../db_util');
const { setBenefitsClassAndPayrollDivision, setTalentAsRTW } = require('./talent_sql_util');
const { ENTITY_COMMON_DATA, STATE_TAX_CODES, SUI_CODES, MARKET_ABBREVIATIONS } = require('../../data/cloudwall/entity_common_data');
const { getResumeByte } = require('../make_resume_json');
const { sendCreateRequestForCreateTalentApi } = require('../post_api_util');

/**
 * Creates talent by passing in yaml data.
 *
 * @param {Object|Object[]} talentToSetup - An array of talent to be created (or singular object)
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and helpers
 * @param {boolean|null} [prds=null] - Only for payroll data setup
 * @param {number|null} [charShiftLastNameTimestamp=null] - Character shift for last name timestamp
 * @param {boolean} [createMatAccount=false] - Whether to create a MAT account
 * @returns {Promise<string|string[]>} Talent ID(s)
 */
async function createTalent(talentToSetup, page, context, prds = null, charShiftLastNameTimestamp = null, createMatAccount = false) {
  if (!Array.isArray(talentToSetup)) {
    talentToSetup = [talentToSetup];
  }
  context.prds = prds;
  context.charShiftLastNameTimestamp = charShiftLastNameTimestamp;

  preprocessYaml(talentToSetup, context);

  const createdTalentIdList = [];

  for (const dataEntry of talentToSetup) {
    if (!(await context.topPage.isInstanceOf('Frameset'))) {
      await context.visitAndLogin(page);
    }

    // Click the `New Talent` button
    await context.topPage.openModule('talent');
    await context.mainPage.clickAsaba('AWUIDrawTalentEnterNew');
    await page.waitForTimeout(10000);
    // expect(context.mainPage).toBeInstanceOf('TalentCreateNewTalentPage');

    // Enter email address and resume then click the `Check for Duplicates` button
    await context.mainPage.quickCreate(dataEntry.email_address, dataEntry.talent_resume);

    // For prds records, attempt to prevent duplicate email addresses
    // by incrementing the number index just before the @ symbol (BIZ-28886)
    if (context.prds && (await context.mainPage.isInstanceOf('TalentCreateNewTalentPage'))) {
      const newEmailAddress = await createUniqueEmailAddress(dataEntry.email_address, dataEntry.talent_resume, page, context);
      dataEntry.email_address = newEmailAddress;
    }

    // expect(context.mainPage).toBeInstanceOf('TalentEditDetail');
    if (dataEntry.country) {
      await context.mainPage.selectCountry(dataEntry.country);
    }
    if (dataEntry.time_zone) {
      await context.mainPage.setField('time_zone', dataEntry.time_zone);
    }
    await context.mainPage.setFields(dataEntry.talent_info);

    if (!createMatAccount) {
      // Say no to the create MAT account modal popup
      await context.sweetAlert2Modal.cancel();
    } else {
      await context.sweetAlert2Modal.confirm();
      // TODO Add code here to find reset email and change the password
    }

    // expect(context.mainPage).toBeInstanceOf('TalentDetail');

    // Push talent id to list
    dataEntry.talent_id = await context.mainPage.getTalentId();
    createdTalentIdList.push(dataEntry.talent_id);

    if (dataEntry.payroll_and_benefits) {
      await fillPayrollAndBenefits(dataEntry, page, context);
    }

    if (dataEntry.payroll_and_benefits_studios_salcon) {
      await fillPayrollAndBenefitsSalcon(dataEntry, page, context);
    }

    if (dataEntry.make_ready_to_work) {
      await makeReadyToWork(page, context);
    }

    if (dataEntry.open_role_start_date || dataEntry.mat_access) {
      await changeRolesAndAccess(dataEntry, page, context);
    }
  }

  return createdTalentIdList.length === 1 ? createdTalentIdList[0] : createdTalentIdList;
}

/**
 * Processes the yaml data before passing it to the creation method.
 * Fills in any missing or blank fields — manually entered data always takes precedent.
 *
 * @param {Object[]} talentToSetup - Array of talent data objects
 * @param {Object} context - Object containing prds, charShiftLastNameTimestamp flags
 */
function preprocessYaml(talentToSetup, context) {
  const charShift = (s, n) => {
    return s.split('').map((c) => String.fromCharCode(c.charCodeAt(0) + n)).join('');
  };

  talentToSetup.forEach((talent, index) => {
    const timestamp = _generateTimestamp();
    const skipField = ['AU', 'CA', 'NL', 'FR'].includes(talent.country);

    // Lookup market data
    if (talent.market) {
      const marketInfo = ENTITY_COMMON_DATA[talent.market] || {};
      talent.talent_info = talent.talent_info || {};
      talent.talent_info = { ...marketInfo, ...talent.talent_info };
    }

    if (talent.talent_name && context.charShiftLastNameTimestamp) {
      const now = new Date();
      const timeStr = _padTwo(now.getHours()) + _padTwo(now.getMinutes()) + _padTwo(now.getSeconds());
      talent.talent_name = talent.talent_name + charShift(timeStr, context.charShiftLastNameTimestamp);
    } else if (talent.talent_name) {
      if (!context.prds) {
        const now = new Date();
        talent.talent_name = talent.talent_name + _padTwo(now.getHours()) + _padTwo(now.getMinutes()) + _padTwo(now.getSeconds());
      }
    } else {
      talent.talent_name = generateTalentName(talent, timestamp);
    }

    const talentInfo = talent.talent_info || {};
    talent.talent_info = talentInfo;
    talentInfo.minor_segment = talentInfo.minor_segment || 119; // CRE_Photographer

    talent.email_address = talent.email_address || generateEmailAddress(talent.talent_name, context.prds);
    talent.talent_resume = talent.talent_resume || 'basic_resume.pdf';

    if (context.prds) {
      // Generate phone number based on area code, 231 (reserved for test data setup), and index
      talentInfo.phone = talentInfo.phone || (talentInfo.area_code + '231' + String(index).padStart(4, '0'));
    } else {
      talentInfo.phone = talentInfo.phone || generatePhoneNumber(talentInfo.area_code);
    }

    // Add a tag to the talent name that corresponds to the field being filled
    const nameFields = ['first_name', 'last_name', 'profile_name', 'address_1', 'professional_title'];
    for (const field of nameFields) {
      const fieldAbbr = field.split('_').map((f) => f[0]).join('');
      talentInfo[field] = talentInfo[field] || (talent.talent_name + ' ' + fieldAbbr);
    }

    if (talent.payroll_and_benefits) {
      if (typeof talent.payroll_and_benefits !== 'object' || talent.payroll_and_benefits === null) {
        talent.payroll_and_benefits = {};
      }
      const payroll = talent.payroll_and_benefits;

      if (context.prds) {
        payroll.date_of_birth = payroll.date_of_birth || '06/01/1983';
      } else {
        payroll.date_of_birth = payroll.date_of_birth || generateBirthday();
      }
      if (!skipField) payroll.marital_status_2020 = payroll.marital_status_2020 || 3;
      payroll.payroll_division = payroll.payroll_division || 250;
      payroll.benefit_class = payroll.benefit_class || 5;
      if (!skipField) payroll.gender = payroll.gender || 1;
      if (!skipField) payroll.ethnicity = payroll.ethnicity || 1;
      if (!skipField) payroll.disability_identification = payroll.disability_identification || 3;

      let taxId;
      if (context.prds) {
        taxId = '123' + String(index + 100) + talentInfo.area_code;
      } else {
        taxId = generateSsn();
      }

      // Australia and Netherlands do not use tax_id field
      if (!['AU', 'NL', 'FR'].includes(talent.country)) {
        payroll.tax_id = payroll.tax_id || taxId;
      }
      if (!skipField) payroll.tax_id_retype = payroll.tax_id_retype || taxId;
      if (!skipField) payroll.state_tax_code = payroll.state_tax_code || STATE_TAX_CODES[talentInfo.state];
      if (!skipField) payroll.sui_code = payroll.sui_code || SUI_CODES[talentInfo.state];
      payroll.save_button = payroll.save_button || 'click';
    }

    if (talent.mat_access) {
      if (typeof talent.mat_access !== 'object' || talent.mat_access === null) {
        talent.mat_access = {};
      }
      talent.mat_access.email_subject = talent.mat_access.email_subject || 'New Aquent Login Information';
      talent.mat_access.mat_password = talent.mat_access.mat_password || 'cwdsMAT$loop5';
    }

    // Area code is only used in preprocessing — delete so it's not used when setFields is called
    delete talentInfo.area_code;
    talentInfo.save_button = talentInfo.save_button || 'click';
  });
}

/**
 * Sets payroll and benefits fields.
 *
 * @param {Object} dataEntry - Talent data entry with payroll_and_benefits
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function fillPayrollAndBenefits(dataEntry, page, context) {
  await page.waitForTimeout(30000); // wait for TalentDetail

  try {
    await context.mainPage.clickAsaba('AWUIDrawTalentViewPayrollBenefits');
  } catch {
    // ElementClickInterceptedError equivalent — force click via JS
    const asabaEl = await context.mainPage.findAsaba('AWUIDrawTalentViewPayrollBenefits');
    await asabaEl.evaluate((el) => el.click());
    await context.driver.updateFrames();
  }

  // expect(context.mainPage).toBeInstanceOf('TalentViewPayrollBenefits');
  await context.mainPage.clickAsaba('AWUIDrawTalentEditPayrollBenefits');
  // expect(context.mainPage).toBeInstanceOf('TalentEditPayrollBenefits');

  if (dataEntry.pay_type_ic) {
    await context.mainPage.click('pay_and_tax_info', 'pay_type_ic');
  }

  await context.mainPage.setFields(dataEntry.payroll_and_benefits);
  await context.driver.updateFrames();

  if (await context.mainPage.isInstanceOf('TalentEditPayrollBenefits')) {
    await context.mainPage.clickAsaba('Save');
  }

  await page.waitForTimeout(60000); // wait for TalentViewPayrollBenefits
}

/**
 * Fills payroll and benefits for Studios/Salcon talents.
 *
 * @param {Object} dataEntry - Talent data entry
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function fillPayrollAndBenefitsSalcon(dataEntry, page, context) {
  await context.mainPage.clickAsaba('AWUIDrawTalentViewPayrollBenefits');
  // expect(context.mainPage).toBeInstanceOf('TalentViewPayrollBenefits');
  await context.mainPage.clickAsaba('AWUIDrawTalentEditPayrollBenefits');
  // expect(context.mainPage).toBeInstanceOf('TalentEditPayrollBenefits');
  await context.mainPage.setFields(dataEntry.payroll_and_benefits_studios_salcon);

  await context.mainPage.submitSave();
  await context.mainPage.clickAsaba('AWUIDrawTalentEditPayrollBenefits');

  await waitAndClick(page, context, 'pay_and_tax_info', 'add_salary_btn');
  await waitAndType(page, context, dataEntry.new_salcon_salary, 'pay_and_tax_info', 'future_weekly_salary');
  await page.waitForTimeout(5000);

  // Calculate last Monday
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek + 6;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysBack);
  const lastMondayStr = _formatDateMDY(lastMonday);

  await waitAndType(page, context, lastMondayStr, 'pay_and_tax_info', 'future_salary_start_date');
  await waitAndClick(page, context, 'pay_and_tax_info', 'save_salary');

  const weeklySalary = await context.mainPage.find('pay_and_tax_info', 'weekly_salary_1').inputValue();
  expect(weeklySalary).toBe(dataEntry.new_salary_string);

  const salaryStartDate = await context.mainPage.find('pay_and_tax_info', 'weekly_salary_start_date_1').inputValue();
  expect(salaryStartDate).toBe(lastMondayStr);

  await context.mainPage.submitSave();
}

/**
 * Changes talent's status to `ready to work`.
 * Must already be in a talent record and not in an edit screen.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function makeReadyToWork(page, context) {
  await context.mainPage.clickAsaba('AWUIDrawTalentChangeStatus');
  // expect(context.mainPage).toBeInstanceOf('TalentChangeStatus');
  await context.mainPage.selectStatusType('ready_to_work');
  await context.mainPage.setInterviewedBy();
  await context.mainPage.click('no_radio_button');
  await context.mainPage.clickAsaba('Save');
}

/**
 * Generates a talent name from data fields.
 *
 * @param {Object} talentInfo - Talent data
 * @param {string} timestamp - Timestamp string
 * @returns {string} Generated talent name
 */
function generateTalentName(talentInfo, timestamp) {
  const name = ['CWG'];
  let market = talentInfo.market || (talentInfo.talent_info && talentInfo.talent_info.city);
  if (market) {
    market = MARKET_ABBREVIATIONS[market.toLowerCase().replace(/ /g, '_')] || 'MNF';
  } else {
    market = 'MNF';
  }
  name.push(market);
  if (talentInfo.payroll_and_benefits) name.push('PB');
  if (talentInfo.mat_access) name.push('MATa');
  name.push(timestamp);
  return name.join(' ');
}

/**
 * Generates an email address from the talent name.
 * Example: 'Thomas Arch DeFelice' → 'thomasarch@defelice.com'
 *
 * @param {string} talentName
 * @param {boolean|null} prds
 * @returns {string}
 */
function generateEmailAddress(talentName, prds = null) {
  const nameParts = talentName.toLowerCase().split(/\s+/);
  if (prds) {
    nameParts.splice(-1, 0, '0');
  }
  nameParts.splice(-1, 0, '@');
  nameParts.push('.com');
  return nameParts.join('');
}

/**
 * Generates a unique email address with a timestamp.
 *
 * @param {string} talentName
 * @returns {string}
 */
function generateUniqueEmailAddress(talentName) {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    _padTwo(now.getMonth() + 1) +
    _padTwo(now.getDate()) +
    _padTwo(now.getHours()) +
    _padTwo(now.getMinutes()) +
    _padTwo(now.getSeconds());
  return '@' + talentName.toLowerCase().split(/\s+/)[0] + dateStr + '.com';
}

/**
 * Generates a random yet valid SSN.
 * Won't ever start with 123 (reserved for payroll tests).
 *
 * @returns {string}
 */
function generateSsn() {
  let group1 = Math.floor(Math.random() * 600) + 200; // 200-799
  if (group1 === 666) group1 += 1;
  const group2 = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  const group3 = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return String(group1) + group2 + group3;
}

/**
 * Generates a random phone number with the given area code.
 *
 * @param {string|number} areaCode
 * @returns {string}
 */
function generatePhoneNumber(areaCode) {
  let prefix = Math.floor(Math.random() * 700) + 200; // 200-899
  if (prefix === 555) prefix += 1;
  const lineNumber = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return String(areaCode) + String(prefix) + lineNumber;
}

/**
 * Generates a random birthday between 20-68 years ago.
 *
 * @param {string} [format='MM/DD/YYYY'] - Output format (only MM/DD/YYYY supported)
 * @returns {string} Date string in MM/DD/YYYY format
 */
function generateBirthday(format = 'MM/DD/YYYY') {
  const daysAgo = Math.floor(Math.random() * (25000 - 7500 + 1)) + 7500;
  const birthday = new Date();
  birthday.setDate(birthday.getDate() - daysAgo);
  return _formatDateMDY(birthday);
}

/**
 * Checks if a talent is RTW and sets them to RTW if not.
 *
 * @param {string} talentId
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function checkTalentSetReadyToWork(talentId, page, context) {
  await context.topPage.openModule('talent');
  // expect(context.mainPage).toBeInstanceOf('ListScreen');

  await context.mainPage.runQuickSearch(talentId);
  // expect(context.resultsPage).toBeInstanceOf('TalentSearchResults');

  await context.resultsPage.selectRowNumber(1);
  await context.mainPage.clickAsaba('AWUIDrawTalentViewPlacementInfo');
  // expect(context.mainPage).toBeInstanceOf('TalentDetail');

  const talentNameText = await context.mainPage.find('talent_name').textContent();
  if (talentNameText.includes('Ready To Work')) {
    console.log('Already Ready To Work');
  } else {
    await context.mainPage.clickAsaba('AWUIDrawTalentChangeStatus');
    // expect(context.mainPage).toBeInstanceOf('TalentChangeStatus');

    await context.mainPage.selectStatusType('ready_to_work');
    const currentStatus = await context.mainPage.find('current_status').textContent();
    if (currentStatus !== 'New - Interview Complete') {
      await context.mainPage.setInterviewedBy();
      await context.mainPage.click('no_radio_button');
    }
    const saved = await context.mainPage.submitSave();
    expect(saved).toBeTruthy();
    // expect(context.mainPage).toBeInstanceOf('TalentDetail');
    const updatedName = await context.mainPage.find('talent_name').textContent();
    expect(updatedName).toContain('Ready To Work');
    console.log('Switched to Ready To Work');
  }
}

/**
 * Logs in and navigates to the talent module.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function loginNavigateToTalent(page, context) {
  await context.visitAndLogin(page);
  // expect(context.topPage).toBeInstanceOf('Frameset');
  await context.topPage.openModule('talent');
  // expect(context.mainPage).toBeInstanceOf('ListScreen');
  // expect(context.searchTopPage).toBeInstanceOf('TalentList');
}

/**
 * Creates a new talent with specified fields.
 *
 * @param {string} resume - Resume filename
 * @param {string} emailAddress - Talent email
 * @param {number} minorSegmentId - Minor segment ID
 * @param {string} professionalTitle - Professional title
 * @param {number} homeMarketId - Home market ID
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<string>} The talent ID
 */
async function createNewTalent(resume, emailAddress, minorSegmentId, professionalTitle, homeMarketId, page, context) {
  await context.topPage.openMenu('talent');
  await context.topPage.clickMenuItem(1);
  // expect(context.mainPage).toBeInstanceOf('TalentCreateNewTalentPage');
  await context.mainPage.setFieldContent('email_address_field', emailAddress);
  await context.mainPage.setResume(resume);
  await context.mainPage.clickAsaba('checkForDupes');
  // expect(context.mainPage).toBeInstanceOf('TalentEditDetail');
  await context.mainPage.setMinorSegment(minorSegmentId);
  await context.mainPage.setHomeMarketSelector(homeMarketId);
  await context.mainPage.switchTab('profile');
  await context.mainPage.setProfessionalTitle(professionalTitle);
  await context.mainPage.submitSave();
  // expect(context.mainPage).toBeInstanceOf('TalentDetail');
  const navBar = await context.mainPage.find('talent_name').textContent();
  return navBar.split(' - ')[1];
}

/**
 * Checks and sets talent availability.
 *
 * @param {string} talentId
 * @param {boolean} [availability=true] - Expected/desired availability
 * @param {boolean} [login=false] - Whether to log into CW
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects and driver
 */
async function checkAndSetAvailability(talentId, availability = true, login = false, page, context) {
  const newPage = await page.context().newPage();

  if (login) {
    await context.visitAndLogin(newPage, 'TalentDetail', talentId);
  } else {
    await context.visit(newPage, 'TalentDetail', talentId);
  }

  await context.mainPageOn(newPage).switchTab('talentDetail');

  const availabilityText = await context.mainPageOn(newPage).find('talentDetail', 'moats_availability_info').textContent();

  if (availability === true && !availabilityText.toLowerCase().includes('available now')) {
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_edit_button');
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_active_search_yes');
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_save_button');
  } else if (availability === false && availabilityText.includes('Available')) {
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_edit_button');
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_active_search_no');
    await context.mainPageOn(newPage).click('talentDetail', 'moats_availability_save_button');
  }

  await newPage.close();
}

/**
 * Changes the open role start date for all roles.
 *
 * @param {Object} dataEntry - Data with open_role_start_date (days offset from today)
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function changeOpenRoleStartDate(dataEntry, page, context) {
  if (!(await context.mainPage.isInstanceOf('TalentRolesAccess'))) {
    await context.mainPage.clickAsaba('AWUIDrawTalentRolesAccess');
  }
  await page.waitForTimeout(3000);

  const daysOffset = parseInt(dataEntry.open_role_start_date, 10);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysOffset);
  const newDate = _formatDateMDY(targetDate);
  await context.mainPage.changeStartDateOnAllOpenRoles(newDate);
}

/**
 * Sends MAT signup email from the talent roles access screen.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @returns {Promise<number>} Timestamp when email was sent (epoch seconds)
 */
async function sendMatSignupEmail(page, context) {
  if (!(await context.mainPage.isInstanceOf('TalentRolesAccess'))) {
    await context.mainPage.clickAsaba('AWUIDrawTalentRolesAccess');
  }
  // expect(context.mainPage).toBeInstanceOf('TalentRolesAccess');
  await context.mainPage.switchTab('edit_username_password');
  await context.mainPage.setField('mat_access_button_yes', 'click');
  return Math.floor(Date.now() / 1000);
}

/**
 * Signs up for MAT using the registration link from email.
 *
 * @param {Object} dataEntry - Talent data entry with mat_access and email_address
 * @param {number} timeSent - Timestamp when email was sent
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing helpers (searchForEmails, etc.)
 */
async function signupForMat(dataEntry, timeSent, page, context) {
  const subject = dataEntry.mat_access.email_subject;
  const emailAddress = dataEntry.email_address;
  const talentFirstName = dataEntry.talent_info.first_name;
  const searchString = context.createEmailSearchString(subject, timeSent, emailAddress, talentFirstName);
  console.log(searchString);
  const matEmail = await context.getEmailsAfterTimeSent(searchString, timeSent);

  const $ = cheerio.load(matEmail[0].body);
  const link = $('a')
    .filter((_, el) => $(el).text() === 'reset your password here')
    .first()
    .attr('href');
  await page.goto(link);

  const password = dataEntry.mat_access.mat_password;
  await context.topPage.type(password, 'new_password');
  await context.topPage.type(password, 'confirm_password');
  await context.topPage.click('reset_password_button');
}

/**
 * Checks if talent activity history includes a given activity type.
 *
 * @param {string} textInTypeColumn - Expected text in the type column
 * @param {Object} context - Object containing activityHistoryPageTalent
 * @returns {Promise<boolean>}
 */
async function talentActivityHistoryIncludes(textInTypeColumn, context) {
  // expect(context.activityHistoryPageTalent).toBeInstanceOf('ActivityHistory');
  const activityCount = await context.activityHistoryPageTalent.getRowCount();

  for (let rowNumber = 1; rowNumber <= activityCount; rowNumber++) {
    const content = await context.activityHistoryPageTalent.getContentForRowNumber(rowNumber);
    if (content.type === textInTypeColumn) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the first row of talent activity history includes a given activity type.
 *
 * @param {string} textInTypeColumn - Expected text in the type column
 * @param {Object} context - Object containing activityHistoryPageTalent
 * @returns {Promise<boolean>}
 */
async function talentActivityHistoryFirstRowIncludes(textInTypeColumn, context) {
  // expect(context.activityHistoryPageTalent).toBeInstanceOf('ActivityHistory');
  const content = await context.activityHistoryPageTalent.getContentForRowNumber('1');
  return content.type === textInTypeColumn;
}

/**
 * Runs a system search for talents.
 *
 * @param {string} search - Search name suffix
 * @param {Object} context - Object containing page objects
 */
async function runSystemSearch(search, context) {
  await context.searchTopPage.setSelectValue('com.aquent.aquentweb1_0.search.system.talent.' + search, 'saved_search');
  await context.searchTopPage.click('go_button');
  // expect(context.resultsPage).toBeInstanceOf('TalentSearchResults');
}

/**
 * Waits for an element to be displayed, then clicks it.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @param  {...string} el - Element locator arguments
 */
async function waitAndClick(page, context, ...el) {
  await context.mainPage.waitForDisplayed(...el, { timeout: 10000 });
  await context.mainPage.click(...el);
}

/**
 * Waits for an element to be displayed, then types text into it.
 * Retries up to 10 times if the value doesn't match.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 * @param {string} text - Text to type
 * @param  {...string} el - Element locator arguments
 */
async function waitAndType(page, context, text, ...el) {
  await context.mainPage.waitForDisplayed(...el, { timeout: 10000 });
  await context.mainPage.type(text, ...el);

  let i = 0;
  let currentValue = await context.mainPage.find(...el).inputValue();
  while (currentValue !== text && i < 10) {
    console.log(`Reattempting to type ${text}`);
    await context.mainPage.clearAndType(text, ...el);
    currentValue = await context.mainPage.find(...el).inputValue();
    i++;
  }
}

/**
 * Grabs talent info from the possible candidates list and talent detail pages.
 *
 * @param {number} rowNumber - Row number in the candidates list
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects, data, talentInfo, timestamp, driver
 */
async function getTalentInfo(rowNumber, page, context) {
  const talent = {};
  const rowData = await context.possibleCandidates.getContentForRowNumber(rowNumber);

  talent.first_name = rowData.first_name;
  talent.last_name = rowData.last_name;

  const row = await context.possibleCandidates.getRowByNumber(rowNumber);
  await row.dblclick();
  await context.driver.updateFrames();

  // Opens the talent detail page in a new tab and grabs talent information
  await page.waitForTimeout(5000);
  // expect(context.mainPage(1)).toBeInstanceOf('TalentDetail');
  await context.mainPage(1).clickAsaba('AWUIDrawTalentEditPlacementInfo');
  // expect(context.mainPage(1)).toBeInstanceOf('TalentEditDetail');
  talent.middle_name = await context.mainPage(1).find('summary', 'middle_name').inputValue();
  await context.mainPage(1).findSelect('summary', 'preferred_pronouns_select').selectByValue(context.data.pronoun_id);
  await context.mainPage(1).submitCancel();

  await page.waitForTimeout(5000);
  // expect(context.mainPage(1)).toBeInstanceOf('TalentDetail');
  talent.full_name = await context.mainPage(1).find('talentDetail', 'talent_full_name').textContent();
  talent.professional_title = (await context.mainPage(1).find('talentDetail', 'professional_title').textContent()).trim();
  talent.id = await context.mainPage(1).getTalentId();

  if (await context.mainPage(1).isDisplayed('talentDetail', 'preferred_pronouns')) {
    talent.pronouns = await context.mainPage(1).find('talentDetail', 'preferred_pronouns').textContent();
  }

  await context.mainPage(1).switchTab('profile');

  // Grab preferred name or empty array
  const preferredNameEls = await context.mainPage(1).findAll('profile', 'preferred_talent_name');

  let preferredName = null;
  let contactName;
  if (preferredNameEls.length === 0) {
    contactName = talent.first_name;
  } else {
    preferredName = (await preferredNameEls[0].textContent()).replace(/[()]/g, '');
    contactName = preferredName;
  }
  talent.contact_name = contactName;
  talent.profile_name = await context.mainPage(1).find('talentDetail', 'talent_full_name').textContent();

  // Construct talent display name for candidate list verification
  const displayFirstName = preferredName ? preferredName + ' ' : talent.first_name + ' ';
  const displayMiddleName = talent.middle_name !== '' ? talent.middle_name + ' ' : '';
  talent.display_name = displayFirstName + displayMiddleName + talent.last_name;

  // Fill in empty agent summary
  const agentSummaryEls = await context.mainPage(1).findAll('profile', 'agent_summary');
  if (agentSummaryEls.length === 0) {
    await context.mainPage(1).clickAsaba('AWUIDrawTalentEditPlacementInfo');
    await context.mainPage(1).switchTab('interviews');
    await context.mainPage(1).find('agent_summary', 'accordion').click();
    await context.mainPage(1).find('agent_summary', 'entry').type(`filled by automation ${context.timestamp}`);
    await context.mainPage(1).submitSave();
  }

  talent.agent_summary = (await context.mainPage(1).find('profile', 'agent_summary').textContent()).trim();
  context.talentInfo.push(talent);

  // Close the tab
  const pages = page.context().pages();
  if (pages.length > 1) {
    await pages[pages.length - 1].close();
  }
}

/**
 * Creates talent via backend API.
 *
 * @param {Object} testData - Test data with json array and optional RTW fields
 * @param {boolean} rtw - Whether to set talent as ready to work
 * @param {string|null} [resume=null] - Resume filename
 * @returns {Promise<string[]>} Array of talent IDs
 */
async function createTalentInBackend(testData, rtw, resume = null) {
  if (resume) {
    const resumeByte = getResumeByte(resume);
    for (const talentJSON of testData.json) {
      talentJSON.resumeData = resumeByte;
    }
  }

  const talents = await sendCreateRequestForCreateTalentApi(testData.json);
  for (const talent of talents) {
    await setBenefitsClassAndPayrollDivision(talent);
    if (rtw) {
      await setTalentAsRTW(talent, testData);
    }
  }
  return talents;
}

/**
 * Opens a talent by ID.
 *
 * @param {string} talentId
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} context - Object containing page objects
 */
async function openTalent(talentId, page, context) {
  if (!(await context.topPage.isInstanceOf('Frameset'))) {
    await context.visitAndLogin(page);
  }
  await context.topPage.openModule('talent');
  await context.mainPage.runQuickSearch(talentId);
  // expect(context.mainPage).toBeInstanceOf('ListScreen');
  // expect(context.resultsPage).toBeInstanceOf('TalentSearchResults');
  await context.resultsPage.selectRowNumber(1);
}

// ---- Private helpers ----

/**
 * Special case for prds records to prevent duplicate email addresses.
 *
 * @param {string} emailAddress
 * @param {string} resume
 * @param {import('@playwright/test').Page} page
 * @param {Object} context
 * @returns {Promise<string>} New unique email address
 * @private
 */
async function createUniqueEmailAddress(emailAddress, resume, page, context) {
  let uniqueEmailAddressFound = false;
  let currentAttempt = 0;
  const maxAttempts = 25;

  while (!uniqueEmailAddressFound && currentAttempt <= maxAttempts) {
    const duplicateEmailAddress = await context.mainPage.getDuplicateEmailAddress();
    expect(duplicateEmailAddress).toBe(emailAddress);

    const indexPosition = duplicateEmailAddress.indexOf('@') - 1;
    const currentIndex = parseInt(duplicateEmailAddress[indexPosition], 10);
    const newIndex = currentIndex + 1;

    emailAddress = duplicateEmailAddress.replace(`${currentIndex}@`, `${newIndex}@`);

    await context.mainPage.quickCreate(emailAddress, resume);

    if (await context.mainPage.isInstanceOf('TalentEditDetail')) {
      uniqueEmailAddressFound = true;
    }
    currentAttempt++;
  }

  return emailAddress;
}

/**
 * Changes roles and access based on data entry.
 *
 * @param {Object} dataEntry
 * @param {import('@playwright/test').Page} page
 * @param {Object} context
 * @private
 */
async function changeRolesAndAccess(dataEntry, page, context) {
  if (dataEntry.open_role_start_date) {
    await changeOpenRoleStartDate(dataEntry, page, context);
  }

  let timeSent;
  if (dataEntry.mat_access) {
    timeSent = await sendMatSignupEmail(page, context);
  }

  await context.mainPage.click('save_button');

  if (dataEntry.mat_access) {
    await signupForMat(dataEntry, timeSent, page, context);
  }
}

// ---- Utility helpers ----

function _generateTimestamp() {
  const now = new Date();
  return _padTwo(now.getDate()) +
    _padTwo(now.getHours()) +
    _padTwo(now.getMinutes()) +
    _padTwo(now.getSeconds()) +
    String(now.getMilliseconds()).charAt(0);
}

function _padTwo(num) {
  return String(num).padStart(2, '0');
}

function _formatDateMDY(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

module.exports = {
  createTalent,
  preprocessYaml,
  fillPayrollAndBenefits,
  fillPayrollAndBenefitsSalcon,
  makeReadyToWork,
  generateTalentName,
  generateEmailAddress,
  generateUniqueEmailAddress,
  generateSsn,
  generatePhoneNumber,
  generateBirthday,
  checkTalentSetReadyToWork,
  loginNavigateToTalent,
  createNewTalent,
  checkAndSetAvailability,
  changeOpenRoleStartDate,
  sendMatSignupEmail,
  signupForMat,
  talentActivityHistoryIncludes,
  talentActivityHistoryFirstRowIncludes,
  runSystemSearch,
  waitAndClick,
  waitAndType,
  getTalentInfo,
  createTalentInBackend,
  openTalent,
};
