// spec_helper.js

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const { test, expect } = require('@playwright/test');
const { queryDatabase, createDbConnection } = require('./db_util');

// Load environment config and test data into process.env
const envConfigPath = path.resolve(__dirname, '../configs/env_rcbot.json');
const testDataPath = path.resolve(__dirname, '../configs/test_data.json');

if (fs.existsSync(envConfigPath)) {
  const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
  for (const [key, value] of Object.entries(envConfig)) {
    process.env[key.toUpperCase()] ||= value;
  }
}

if (fs.existsSync(testDataPath)) {
  const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
  if (testData.credentials) {
    for (const [key, value] of Object.entries(testData.credentials)) {
      process.env[key.toUpperCase()] ||= value;
    }
  }
}

// Ensure tmp directory exists
if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp');
}

/**
 * Checks if running on Linux.
 *
 * @returns {boolean}
 */
function isLinux() {
  return process.platform === 'linux';
}

/**
 * Reads a feature flag status via API.
 *
 * @param {string} featureName - Name of the feature flag
 * @param {Function} apiBaseUrl - Function that returns the base URL
 * @returns {Promise<boolean>}
 */
async function readFeature(featureName, apiBaseUrl) {
  try {
    const response = await axios.get(apiBaseUrl(`/api/v1/feature/${featureName}`));
    return String(response.data) === 'true';
  } catch {
    return false;
  }
}

/**
 * Reads a feature flag status via database query.
 *
 * @param {string} featureName - Name of the feature flag
 * @returns {Promise<boolean>}
 */
async function readFeatureUsingQuery(featureName) {
  const sql = `SELECT status FROM feature WHERE feature = '${featureName}'`;
  const result = await queryDatabase(sql);
  return result[0]?.status?.toString() === 't';
}

/**
 * Retrieves multiple feature flags in a single database query.
 *
 * @param {string[]} featureNames - Array of feature flag names to check
 * @returns {Promise<Object<string, boolean>>} Hash mapping feature names to their status
 */
async function readFeaturesBatch(featureNames) {
  if (!featureNames || featureNames.length === 0) return {};

  // Build the IN clause with proper SQL escaping
  const featureList = featureNames.map((name) => `'${name.replace(/'/g, "''")}'`).join(', ');
  const query = `SELECT feature, status FROM feature WHERE feature IN (${featureList})`;
  const result = await queryDatabase(query);

  // Convert result to a hash of feature_name => boolean_status
  const featureStatuses = {};
  for (const row of result) {
    featureStatuses[row.feature] = row.status?.toString() === 't';
  }

  // Ensure any missing features are included as false
  for (const name of featureNames) {
    if (!(name in featureStatuses)) {
      featureStatuses[name] = false;
    }
  }

  return featureStatuses;
}

/**
 * Gets the order ID for an order with a given position title.
 *
 * @param {string} positionTitle - The position title to search for
 * @param {number} [orderResultIndex=0] - Index of result to return if multiple match
 * @returns {Promise<number|string>} The order_id or an error message
 */
async function readOrderIdForOrderPositionTitle(positionTitle, orderResultIndex = 0) {
  const query = `SELECT order_id FROM job_order WHERE position_title = '${positionTitle}' ORDER BY create_date;`;
  const result = await queryDatabase(query);

  if (result.length === 0) {
    return `Test setup error: Unable to find an order with the Position Title: "${positionTitle}" when attempting to read from the job_order table`;
  }

  return parseInt(result[orderResultIndex].order_id, 10);
}

/**
 * Gets the order ID for an order with a given job posting ID.
 *
 * @param {string} jobPostingId - The posting ID to search for
 * @param {number} [orderResultIndex=0] - Index of result to return if multiple match
 * @returns {Promise<number|string>} The order_id or an error message
 */
async function readOrderIdForJobPostingId(jobPostingId, orderResultIndex = 0) {
  const query = `SELECT order_id FROM job_posting WHERE job_posting_id = '${jobPostingId}';`;
  const result = await queryDatabase(query);

  if (result.length === 0) {
    return `Unable to find an order for job posting id: "${jobPostingId}"`;
  }

  return parseInt(result[orderResultIndex].order_id, 10);
}

/**
 * Gets the posting ID for an order with a given order ID.
 *
 * @param {string} orderId - The order ID to search for
 * @param {number} [postingResultIndex=0] - Index of result to return if multiple match
 * @returns {Promise<number|string>} The posting_id or an error message
 */
async function readJobPostingIdForOrderId(orderId, postingResultIndex = 0) {
  const query = `SELECT job_posting_id FROM job_posting WHERE order_id = '${orderId}';`;
  const result = await queryDatabase(query);

  if (result.length === 0) {
    return `Unable to find a posting id for order id: "${orderId}"`;
  }

  return parseInt(result[postingResultIndex].job_posting_id, 10);
}

/**
 * Reads person ID by email address.
 *
 * @param {string} email
 * @returns {Promise<string>}
 */
async function readPersonIdByEmail(email) {
  const query = `SELECT person_id FROM person WHERE email = '${email}'`;
  const result = await queryDatabase(query);
  return result[0].person_id;
}

/**
 * Retrieves the email of an existing talent based on the given market ID.
 *
 * @param {number} marketId - The market ID to search for
 * @param {number} [index=0] - Index of result to return
 * @returns {Promise<string>} The talent email
 */
async function getExistingTalentEmailByMarket(marketId, index = 0) {
  const query = `
    SELECT email
    FROM person
    JOIN talent USING (person_id)
    JOIN person_emp_info USING (person_id)
    WHERE home_market_id = ${marketId}
    LIMIT 20;`;
  const result = await queryDatabase(query);

  if (result.length === 0) {
    throw new Error(`Unable to find existing talent for market id: ${marketId}`);
  }

  return result[index].email;
}

/**
 * Retrieves the most recent One-Time Passcode (OTP) for a given email address.
 *
 * @param {string} email - The email address associated with the OTP
 * @param {number} [index=0] - Index of result to return
 * @returns {Promise<string>} The OTP code
 */
async function getOtpCodeFromDb(email, index = 0) {
  const query = `
    SELECT code
    FROM one_time_code
    WHERE user_name = '${email}'
    ORDER BY create_date DESC
    LIMIT 1`;
  const result = await queryDatabase(query);

  if (result.length === 0) {
    throw new Error(`Unable to find One Time Passcode for email: ${email}`);
  }

  return result[index].code;
}

/**
 * Loads YAML data for a spec file.
 *
 * @param {string} specFile - The spec file path
 * @returns {Object|null} The parsed YAML data, or null if file doesn't exist
 */
function loadSpecData(specFile) {
  const yamlFile = specFile
    .replace(/^\.\/specs\//, 'data/yaml/')
    .replace(/\.spec\.(js|ts)$/, '.yaml')
    .replace(/\.(js|ts)$/, '.yaml');

  if (fs.existsSync(yamlFile)) {
    console.log(`Loading data from file '${yamlFile}'`);
    const fileContent = fs.readFileSync(yamlFile, 'utf-8');
    return yaml.load(fileContent);
  }

  return null;
}

/**
 * Loads YAML data from a given file path.
 *
 * @param {string} filePath - Path to the YAML file
 * @returns {Object} Parsed YAML data
 */
function loadData(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(fileContent);
}

/**
 * Creates the config object from environment variables.
 *
 * @returns {Object} Configuration object
 */
function createConfig() {
  return {
    browser: process.env.BROWSER || 'chromium',
    browserHost: process.env.BROWSER_HOST,
    s3OutputBucket: process.env.S3_OUTPUT_BUCKET,
    adminUserName: process.env.admin_username,
    agentUserName: process.env.agent_username,
    agentPassword: process.env.agent_pwd,
    authLoginPassword: process.env.auth_login_password,
    payrollUserName: process.env.PAYROLL_USERNAME,
    talentUserName: process.env.talent_username,
    talentPassword: process.env.talent_pwd,
    talentNewPassword: process.env.talent_new_pwd,
    talentUkUserName: process.env.talent_uk_username,
    talentUkPassword: process.env.talent_uk_pwd,
    talentSalconUserName: process.env.talent_salcon_username,
    talentSalconPassword: process.env.talent_salcon_pwd,
    talentIcUserName: process.env.talent_ic_username,
    talentIcPassword: process.env.talent_ic_pwd,
    googleUsername: process.env.GOOGLE_USERNAME,
    googlePassword: process.env.GOOGLE_PASSWORD,
    imap_hostname: process.env.IMAP_HOSTNAME,
    imap_username: process.env.IMAP_USERNAME,
    imap_password: process.env.IMAP_PASSWORD,
    scheduledJobUsername: process.env.SCHEDULED_JOB_USERNAME,
    scheduledJobPassword: process.env.SCHEDULED_JOB_PASSWORD,
    contactUsername: process.env.CONTACT_USERNAME,
    contactPassword: process.env.CONTACT_PASSWORD,
    macUsername: process.env.MAC_USERNAME,
    macPassword: process.env.MAC_PASSWORD,
    macGeneralPwd: process.env.mac_general_pwd,
    sharedServicesUsername: process.env.SHARED_SERVICES_USERNAME,
    webHost: process.env.WEB_HOST,
    profileHost: process.env.PROFILE_HOST,
    hrGroupUsername: process.env.hr_group_username,
    orderAppQualifier: process.env.ORDER_APP_QUALIFIER,
    noMfaUsername: process.env.no_mfa_username,
    noMfaPassword: process.env.no_mfa_password,
    siaUsername: process.env.sia_username,
    siaSaUsername: process.env.sia_sa_username,
    siaPassword: process.env.sia_password,
    ciaUsername: process.env.cia_username,
    ciaPassword: process.env.cia_password,
    ciaAdminUsername: process.env.cia_admin_username,
    ceridianQueueActive: process.env.CERIDIAN_QUEUE_ACTIVE,
  };
}

/**
 * Creates a base test fixture with config and data loading.
 * Usage:
 *   const { testWithConfig } = require('./spec_helper');
 *   testWithConfig('my test', async ({ page, config, data }) => { ... });
 */
const testWithConfig = test.extend({
  config: async ({}, use) => {
    const config = createConfig();
    await use(config);
  },
  data: async ({}, use, testInfo) => {
    const specFile = testInfo.file;
    const data = loadSpecData(specFile);
    await use(data);
  },
});

module.exports = {
  isLinux,
  readFeature,
  readFeatureUsingQuery,
  readFeaturesBatch,
  readOrderIdForOrderPositionTitle,
  readOrderIdForJobPostingId,
  readJobPostingIdForOrderId,
  readPersonIdByEmail,
  getExistingTalentEmailByMarket,
  getOtpCodeFromDb,
  loadSpecData,
  loadData,
  createConfig,
  testWithConfig,
};