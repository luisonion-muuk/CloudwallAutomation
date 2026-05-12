// Migrated from: post_api_util.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)

const { expect } = require('@playwright/test');

// ──────────────────────────────────────────────────────────────────────────────
// Host resolution
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Determines the API environment suffix based on the SERVER_HOST env var.
 * Mirrors Ruby's set_api_host_address.
 *
 * @returns {string}
 */
function setApiHostAddress() {
  const host = process.env.SERVER_HOST || '';
  if (host.includes('beta.')) return 'beta';
  if (host.includes('alpha.')) return 'alpha';
  if (host.includes('rc.')) return 'rc';
  if (host.includes('lro.')) return 'lro';
  return 'rcbot';
}

/**
 * Returns the Create Order API base URL, setting it in process.env if not already present.
 * @returns {string}
 */
function getCreateOrderApiHost() {
  if (!process.env.CREATE_ORDER_API_HOST) {
    const env = setApiHostAddress();
    process.env.CREATE_ORDER_API_HOST = `https://create-order-${env}.aquent.io`;
  }
  return process.env.CREATE_ORDER_API_HOST;
}

/**
 * Returns the Create Talent API base URL, setting it in process.env if not already present.
 * @returns {string}
 */
function getCreateTalentApiHost() {
  if (!process.env.CREATE_TALENT_API_HOST) {
    const env = setApiHostAddress();
    process.env.CREATE_TALENT_API_HOST = `https://create-talent-${env}.aquent.io`;
  }
  return process.env.CREATE_TALENT_API_HOST;
}

// ──────────────────────────────────────────────────────────────────────────────
// Order API helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Sends a POST request to the Create Order API.
 * Mirrors Ruby's send_request_to_create_order_api.
 *
 * @param {object} request - order data payload
 * @returns {Promise<object>} parsed JSON response
 */
async function sendRequestToCreateOrderApi(request) {
  const host = getCreateOrderApiHost();
  const response = await fetch(`${host}/order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CREATE_ORDER_API_KEY,
    },
    body: JSON.stringify(request),
  });

  expect(response.status).toBe(200);
  return response.json();
}

/**
 * Sends a PUT request to the Create Order API.
 * Mirrors Ruby's send_update_request_to_create_order_api.
 *
 * @param {object} request - order data payload
 * @returns {Promise<object>} parsed JSON response
 */
async function sendUpdateRequestToCreateOrderApi(request) {
  const host = getCreateOrderApiHost();
  const response = await fetch(`${host}/order/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CREATE_ORDER_API_KEY,
    },
    body: JSON.stringify(request),
  });

  expect(response.status).toBe(200);
  return response.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Talent API helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Shifts each character in a string by n code points.
 * Mirrors Ruby's char_shift Proc.
 *
 * @param {string} str
 * @param {number} n
 * @returns {string}
 */
function charShift(str, n) {
  return str
    .split('')
    .map((c) => String.fromCharCode(c.charCodeAt(0) + n))
    .join('');
}

/**
 * Generates a timestamp string matching Ruby's Time.now.strftime '%d%H%M%S%1N'.
 * @returns {string}
 */
function generateTimestamp() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).charAt(0);
  return `${dd}${HH}${MM}${SS}${ms}`;
}

/**
 * Processes talent YAML data before sending it to the creation API.
 * Fills in missing or blank fields; manually entered data takes precedence.
 * Mirrors Ruby's preprocess_talent_yaml.
 *
 * @param {object|object[]} talentToSetup - single talent object or array of talent objects
 * @param {object} [opts={}]
 * @param {number|null} [opts.charShiftLastNameTimestamp] - if set, shifts the last name timestamp
 * @param {boolean} [opts.prds] - if true, generates deterministic phone numbers
 * @param {Function} opts.generateUniqueEmailAddress - function(lastName) => email suffix
 * @param {Function} opts.generatePhoneNumber - function(areaCode) => phone number
 * @returns {object[]}
 */
function preprocessTalentYaml(talentToSetup, opts = {}) {
  if (!Array.isArray(talentToSetup)) {
    talentToSetup = [talentToSetup];
  }

  // Ensure all keys are strings (Ruby version converted symbols to strings)
  talentToSetup = talentToSetup.map((talent) => {
    const normalized = {};
    for (const [key, value] of Object.entries(talent)) {
      normalized[String(key)] = value;
    }
    return normalized;
  });

  talentToSetup.forEach((talent, index) => {
    const skipField = ['AU', 'CA', 'NL', 'FR'].includes(talent.country);

    if (talent.lastName && opts.charShiftLastNameTimestamp) {
      const timeStr = new Date().toTimeString().replace(/\D/g, '').slice(0, 6); // HHMMSS
      talent.lastName = talent.lastName + charShift(timeStr, opts.charShiftLastNameTimestamp);
    }

    talent.jobTypeId = talent.jobTypeId || 119; // CRE_Photographer

    if (opts.generateUniqueEmailAddress) {
      talent.email += opts.generateUniqueEmailAddress(talent.lastName);
    }

    if (opts.prds) {
      // Generate a deterministic phone number: area_code + '231' + zero-padded index
      talent.phoneNumber = talent.phoneNumber || `${talent.area_code}231${String(index).padStart(4, '0')}`;
    } else if (opts.generatePhoneNumber) {
      talent.phoneNumber = talent.phoneNumber || opts.generatePhoneNumber(talent.area_code);
    }
  });

  return talentToSetup;
}

/**
 * Sends a POST request to the Create Talent API.
 * Mirrors Ruby's send_create_request_for_create_talent_api.
 *
 * @param {object|object[]} request - talent data payload (will be preprocessed)
 * @param {object} [preprocessOpts={}] - options passed to preprocessTalentYaml
 * @returns {Promise<string[]>} array of new talent person IDs
 */
async function sendCreateRequestForCreateTalentApi(request, preprocessOpts = {}) {
  const host = getCreateTalentApiHost();
  const processedRequest = preprocessTalentYaml(request, preprocessOpts);

  const response = await fetch(`${host}/talent/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.CREATE_TALENT_API_KEY,
    },
    body: JSON.stringify(processedRequest),
  });

  expect(response.status).toBe(200);
  const jsonResponse = await response.json();
  return jsonResponse.newTalentPersonIds;
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
  setApiHostAddress,
  sendRequestToCreateOrderApi,
  sendUpdateRequestToCreateOrderApi,
  sendCreateRequestForCreateTalentApi,
  preprocessTalentYaml,
};
