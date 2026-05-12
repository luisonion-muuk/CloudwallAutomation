// Migrated from: util.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby/RSpec)

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { expect } = require('@playwright/test');

// ──────────────────────────────────────────────────────────────────────────────
// Timestamp helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get the current UTC timestamp.
 * @returns {Date}
 */
function getUtcTimestamp() {
  return new Date();
}

/**
 * Get the current UTC date as an ISO date string (YYYY-MM-DD).
 * @returns {string}
 */
function getUtcDate() {
  return new Date().toISOString().split('T')[0];
}

// ──────────────────────────────────────────────────────────────────────────────
// Polling / wait helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Polls `fn` every `intervalMs` until it returns a truthy value or `timeoutMs` elapses.
 * Mirrors Ruby's Selenium::WebDriver::Wait — ignores errors thrown by `fn` during polling.
 *
 * @param {Function} fn        - async or sync function to evaluate each interval
 * @param {number}   timeoutMs - total time to wait in milliseconds (default 15 000)
 * @param {number}   intervalMs- polling interval in milliseconds (default 500)
 * @param {string}   [message] - custom error message on timeout
 * @returns {Promise<*>} the truthy value returned by `fn`
 */
async function waitFor(fn, timeoutMs = 15000, intervalMs = 500, message = null) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (_ignored) {
      // mirrors Ruby's ignore: [NoSuchElementError, StaleElementReferenceError]
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(message || `waitFor timed out after ${timeoutMs}ms`);
}

/**
 * Wait for a predicate to return true.
 * Mirrors Ruby's wait_until which also called @driver.update_frames on each poll.
 * In Playwright frame handling is automatic, so the `updateFrames` param is kept
 * for API parity but is a no-op.
 *
 * @param {Function} predicate      - async function that should eventually return true
 * @param {number}   [timeoutMs]    - total time in ms (default 120 000)
 * @param {boolean}  [updateFrames] - kept for API parity (no-op in Playwright)
 */
async function waitUntil(predicate, timeoutMs = 120000, updateFrames = true) {
  await waitFor(predicate, timeoutMs);
}

/**
 * Execute `action` in a loop until `timeoutMs` elapses or `predicate` returns true.
 * Mirrors Ruby's wait_for_until.
 *
 * @param {Function} action    - async function executed every iteration
 * @param {Function} predicate - async function; loop breaks when it returns true
 * @param {number}   timeoutMs - max duration in ms (default 120 000)
 */
async function waitForUntil(action, predicate, timeoutMs = 120000) {
  const start = Date.now();
  while (true) {
    await action();
    const done = await predicate();
    if (done || Date.now() - start > timeoutMs) break;
  }
}

/**
 * Execute `action` in a loop until `timeoutMs` elapses.
 * Mirrors Ruby's until_timeout.
 *
 * @param {Function} action    - async function executed every iteration
 * @param {number}   timeoutMs - max duration in ms
 */
async function untilTimeout(action, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await action();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Data loading
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Loads and parses a YAML file.
 * Mirrors Ruby's YAML.ext_load_file.
 *
 * @param {string} filename - path to the YAML file
 * @returns {object}
 */
function loadData(filename) {
  const filePath = path.resolve(filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContents);
}

/**
 * Reads a script file from the scripts/ directory.
 * Mirrors Ruby's IO.read "scripts/#{filename}".
 *
 * @param {string} filename - name of the script file (relative to scripts/)
 * @returns {string}
 */
function loadScript(filename) {
  return fs.readFileSync(path.resolve('scripts', filename), 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────────
// Object / value helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Remaps every value in an object via a callback, or plucks a property.
 * Mirrors Ruby's hmap.
 *
 * @param {object}         obj  - source object
 * @param {Function|string} fnOrProp - mapping function *or* property name to pluck
 * @returns {object}
 */
function hmap(obj, fnOrProp) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = typeof fnOrProp === 'function' ? fnOrProp(val) : val[fnOrProp];
  }
  return result;
}

/**
 * Checks if a string represents an integer.
 *
 * @param {*} val
 * @returns {boolean}
 */
function isInteger(val) {
  return /^[-+]?\d+$/.test(String(val));
}

/**
 * Tries to convert numeric strings to integers; processes arrays recursively.
 *
 * @param {*} val
 * @returns {*}
 */
function tryToInt(val) {
  if (Array.isArray(val)) {
    return val.map(tryToInt);
  }
  return isInteger(val) ? parseInt(val, 10) : val;
}

// ──────────────────────────────────────────────────────────────────────────────
// Environment helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns the name of the env currently running in (e.g. alpha, beta, rc, rcbot).
 * Mirrors Ruby's get_env_name.
 *
 * @returns {string}
 */
function getEnvName() {
  const host = process.env.SERVER_HOST || '';
  const match = host.match(/cw-([a-z]*)/);
  if (match) return match[1];
  return host === 'localhost' ? 'dev' : host;
}

// ──────────────────────────────────────────────────────────────────────────────
// Money helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Converts a money string to a float, stripping $ signs and commas.
 * @example moneyStringToFloat("$1,200.45") // => 1200.45
 *
 * @param {string} moneyString
 * @returns {number}
 */
function moneyStringToFloat(moneyString) {
  return parseFloat(moneyString.replace(/[$,]/g, ''));
}

/**
 * Converts a number to a comma-delimited money string with an optional symbol.
 * Mirrors Ruby's f_to_money_string using ActiveSupport's number_to_currency.
 *
 * @example fToMoneyString(1200.45)             // => "$1,200.45"
 * @example fToMoneyString(1200.45, '')          // => "1,200.45"
 *
 * @param {number} value
 * @param {string} [moneySymbol='$'] - symbol to prepend
 * @returns {string}
 */
function fToMoneyString(value, moneySymbol = '$') {
  const fixed = Number(value).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${moneySymbol}${withCommas}.${decPart}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Field verification
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Iterates over foundValues and compares each key against expectedValues.
 * Returns `true` if all match, or a descriptive error string listing mismatches.
 * Mirrors Ruby's verify_fields.
 *
 * @param {object} foundValues
 * @param {object} expectedValues
 * @returns {true|string}
 */
function verifyFields(foundValues, expectedValues) {
  const errors = [];

  for (const [field, value] of Object.entries(foundValues)) {
    const expected = expectedValues[field];

    // Deep-equal comparison that works for primitives, arrays, and objects
    try {
      if (value !== expected && JSON.stringify(value) !== JSON.stringify(expected)) {
        errors.push(`${field} - expected ${JSON.stringify(expected)}, but got ${JSON.stringify(value)}`);
      }
    } catch {
      if (value !== expected) {
        errors.push(`${field} - expected ${expected}, but got ${value}`);
      }
    }
  }

  if (errors.length === 0) return true;
  return ` for the following fields:\n${errors.join('\n')}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
  getUtcTimestamp,
  getUtcDate,
  waitFor,
  waitUntil,
  waitForUntil,
  untilTimeout,
  loadData,
  loadScript,
  hmap,
  isInteger,
  tryToInt,
  getEnvName,
  moneyStringToFloat,
  fToMoneyString,
  verifyFields,
};
