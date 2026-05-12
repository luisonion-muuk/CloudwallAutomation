// email_util.js

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');

const POLL_TIMEOUT = 60;
const POLL_INTERVAL = 10;

/**
 * Search for emails received after a given timestamp.
 * The timestamp is required; additional search criteria can and should be supplied.
 *
 * This method works by including a date search in the server side search criteria,
 * and then filtering messages on the client side based on their internal timestamps.
 *
 * @param {number} timestamp - Seconds since the epoch
 * @param {boolean} returnMessages - Whether to return full message data
 * @param {Object} [otherCriteria={}] - Additional search criteria
 * @param {string|string[]} [otherCriteria.subject] - Substring match in Subject header
 * @param {string|string[]} [otherCriteria.body] - Substring match in message body
 * @param {number} [otherCriteria.count] - Minimum count of matches to succeed (default 1)
 * @param {number} [otherCriteria.size] - Search for messages larger than this size
 * @param {Object} config - Config object with imap_hostname, imap_username, imap_password
 * @returns {Promise<Object[]|null>} Array of { message, body } or null
 */
async function findEmailAfter(timestamp, returnMessages, otherCriteria = {}, config) {
  const sinceDate = _formatImapDate(timestamp);
  const searchCriteria = [['SINCE', sinceDate]];

  const subjects = Array.isArray(otherCriteria.subject)
    ? otherCriteria.subject
    : otherCriteria.subject ? [otherCriteria.subject] : [];
  for (const term of subjects) {
    searchCriteria.push(['SUBJECT', term]);
  }

  const bodies = Array.isArray(otherCriteria.body)
    ? otherCriteria.body
    : otherCriteria.body ? [otherCriteria.body] : [];
  for (const term of bodies) {
    searchCriteria.push(['BODY', term]);
  }

  if (otherCriteria.size) {
    searchCriteria.push(['LARGER', String(otherCriteria.size)]);
  }

  const imap = _createImapConnection(config);

  try {
    await _imapConnect(imap);
    await _imapOpenBox(imap, 'INBOX', true); // readonly

    const minCount = otherCriteria.count || 1;
    const started = Math.floor(Date.now() / 1000);
    let found = [];

    while (true) {
      const searchResults = await _imapSearch(imap, searchCriteria.flat());

      if (searchResults.length > 0) {
        // Fetch internal dates and filter by timestamp
        const fetched = await _imapFetch(imap, searchResults, { bodies: '', struct: false });
        found = fetched.filter((item) => {
          const internalDate = new Date(item.attrs.date);
          return Math.floor(internalDate.getTime() / 1000) > timestamp;
        });

        if (found.length >= minCount) break;
      }

      const now = Math.floor(Date.now() / 1000);
      if (now + POLL_INTERVAL > started + POLL_TIMEOUT) {
        throw new Error(`email not found within ${POLL_TIMEOUT}s`);
      }

      await _sleep(POLL_INTERVAL * 1000);
    }

    if (returnMessages) {
      const seqnos = found.map((item) => item.attrs.uid);
      const fullMessages = await _imapFetch(imap, seqnos, { bodies: '' });

      const results = [];
      for (const msg of fullMessages) {
        const rawBody = msg.body;
        const parsed = await simpleParser(rawBody);
        const bodyText = parsed.html || parsed.text || (parsed.textAsHtml || '');

        results.push({
          message: parsed,
          body: normalizeBody(bodyText),
        });
      }

      imap.end();
      return results;
    }

    imap.end();
    return null;
  } catch (e) {
    imap.end();
    throw e;
  }
}

/**
 * Searches for emails matching criteria with polling/retry logic.
 *
 * @param {Object|Array} searchCriteria - IMAP search criteria (hash or array)
 * @param {Object} [opts={}] - Options
 * @param {number} [opts.wait=60] - Time to wait in seconds
 * @param {number} [opts.interval=15] - Polling interval in seconds
 * @param {boolean} [opts.data=false] - Whether to return message contents
 * @param {number|null} [opts.size=null] - Expected number of emails
 * @param {number|null} [opts.since=null] - Epoch timestamp; emails before this are ignored
 * @param {Object} config - Config object with imap_hostname, imap_username, imap_password
 * @param {import('@playwright/test').Page|null} [page=null] - Playwright page (for keepalive)
 * @returns {Promise<Object[]>} Array of matched emails
 */
async function searchForEmails(searchCriteria, opts = {}, config, page = null) {
  const emailWait = opts.wait || 60;
  const interval = opts.interval || 15;
  const data = opts.data || false;
  const size = opts.size || null;
  const since = opts.since || null;

  console.log(`Searching for email using the following keywords: ${JSON.stringify(searchCriteria)}`);

  // Convert hash-style criteria to IMAP search array
  let imapCriteria = [];
  if (searchCriteria && !Array.isArray(searchCriteria)) {
    for (const [key, value] of Object.entries(searchCriteria)) {
      const convertedValue = convertSearchValue(key, value);
      imapCriteria.push(key.toUpperCase(), convertedValue);
    }
  } else {
    imapCriteria = searchCriteria || [];
  }

  // Add SINCE clause if timestamp provided
  if (since) {
    const sinceStr = _formatImapDate(since);
    imapCriteria = ['SINCE', sinceStr, ...imapCriteria];
  }

  const imap = _createImapConnection(config);

  try {
    await _imapConnect(imap);
    await _imapOpenBox(imap, 'INBOX', false);

    const started = Math.floor(Date.now() / 1000);
    const errorMessage = `\`searchForEmails\` timed out after ${emailWait} seconds`;

    while (true) {
      // Perform a simple action on the page to prevent orphaned session
      if (page) {
        try { await page.url(); } catch { /* ignore */ }
      }

      let found = await _imapSearch(imap, imapCriteria);

      // Filter by INTERNALDATE if since is provided
      if (since && found.length > 0) {
        const fetched = await _imapFetch(imap, found, { bodies: '', struct: false });
        found = fetched
          .filter((item) => {
            const internalDate = new Date(item.attrs.date);
            return Math.floor(internalDate.getTime() / 1000) > since;
          })
          .map((item) => item.attrs.uid);
      }

      if (found.length === 0 || (size !== null && found.length !== size)) {
        const now = Math.floor(Date.now() / 1000);
        if (now + interval > started + emailWait) {
          throw new Error(errorMessage);
        }
        await _sleep(interval * 1000);
        continue;
      }

      // Found matching emails
      if (data) {
        const fullMessages = await _imapFetch(imap, found, { bodies: '' });
        const results = [];

        for (const msg of fullMessages) {
          const rawBody = msg.body;
          const parsed = await simpleParser(rawBody);
          const bodyText = parsed.html || parsed.text || '';

          results.push({
            message: parsed,
            body: normalizeBody(bodyText),
          });
        }

        const elapsed = Math.floor(Date.now() / 1000) - started;
        console.log(`email found in ${elapsed}s, hence with ~${emailWait - elapsed}s to spare`);

        imap.end();
        return results;
      }

      const elapsed = Math.floor(Date.now() / 1000) - started;
      console.log(`email found in ${elapsed}s, hence with ~${emailWait - elapsed}s to spare`);

      imap.end();
      return found;
    }
  } catch (e) {
    try { imap.end(); } catch { /* ignore */ }
    throw e;
  }
}

/**
 * Converts search values for IMAP, e.g. epoch timestamps to date strings.
 *
 * @param {string} keyword - Search keyword
 * @param {*} value - Search value
 * @returns {*} Converted value
 */
function convertSearchValue(keyword, value) {
  if (keyword === 'since' && typeof value === 'number') {
    return _formatImapDate(value);
  }
  return value;
}

/**
 * Assembles IMAP SEARCH keywords and arguments.
 *
 * @param {string|null} subject - Subject line to search for
 * @param {number|null} timeSent - Epoch timestamp; emails before this are ignored
 * @param {...string|string[]} other - Additional body search strings
 * @returns {Array} IMAP search criteria array
 */
function emailSearchCriteria(subject, timeSent, ...other) {
  const searchQuery = [];
  // Flatten if first arg is an array
  const otherTerms = Array.isArray(other[0]) ? other[0] : other;

  if (subject) {
    searchQuery.push('SUBJECT', subject);
  }
  if (timeSent) {
    searchQuery.push('SINCE', _formatImapDate(timeSent));
  }
  for (const text of otherTerms) {
    if (text) searchQuery.push('BODY', text);
  }
  return searchQuery;
}

/**
 * Alias for emailSearchCriteria (deprecated name).
 */
function createEmailSearchString(subject, timeSent, ...other) {
  console.warn('WARNING, this does not return a string anymore; call emailSearchCriteria() instead!');
  return emailSearchCriteria(subject, timeSent, ...other);
}

/**
 * Checks for the M:AC New User Registration email and gets the link.
 *
 * @param {number} timeSent - Epoch timestamp
 * @param {string} contactFirstName - Contact's first name to search in body
 * @param {Object} config - IMAP config
 * @param {Function} getEnvName - Function returning the environment name
 * @returns {Promise<string>} The registration link URL
 */
async function getContactRegistrationLink(timeSent, contactFirstName, config, getEnvName) {
  const { expect } = require('@playwright/test');

  const emailSubject = `[${getEnvName()}] MyAquent New User Registration`;
  const criteria = emailSearchCriteria(emailSubject, timeSent, contactFirstName);
  const email = await searchForEmails(criteria, { data: true }, config);
  expect(email.length).toBe(1);

  const $ = cheerio.load(email[0].body);
  const link = $('a')
    .filter((_, el) => $(el).text().includes('REGISTER NOW'))
    .first()
    .attr('href');

  return link;
}

/**
 * Gets emails after a given timestamp, sorted by date.
 *
 * @param {Array} emailSearchString - IMAP search criteria
 * @param {number} timeSent - Epoch timestamp
 * @param {number} [totalWaitTime=60] - Total wait time in seconds
 * @param {Object} config - IMAP config
 * @returns {Promise<Object[]>} Sorted array of matching emails
 */
async function getEmailsAfterTimeSent(emailSearchString, timeSent, totalWaitTime = 60, config) {
  const startTime = Math.floor(Date.now() / 1000);
  let email = null;

  while (true) {
    const allEmails = await searchForEmails(emailSearchString, { data: true }, config);
    email = allEmails.filter((e) => {
      const emailDate = new Date(e.message.date);
      return Math.floor(emailDate.getTime() / 1000) > timeSent;
    });

    if (email.length > 0) break;

    const elapsed = Math.floor(Date.now() / 1000) - startTime;
    if (elapsed >= totalWaitTime) {
      throw new Error(`getEmailsAfterTimeSent timed out after ${totalWaitTime}s`);
    }

    await _sleep(10000);
  }

  // Sort by date ascending
  email.sort((a, b) => new Date(a.message.date) - new Date(b.message.date));
  return email;
}

/**
 * Extracts the X-Original-To email address from an email.
 *
 * @param {Object} email - Email object with message property
 * @returns {string|null} The extracted email address or null
 */
function xOriginalToString(email) {
  const header = email.message.headers?.get('x-original-to');
  if (!header) return null;

  const headerValue = typeof header === 'string' ? header : header.text || String(header);
  const match = headerValue.match(/[\w+\-.]+@[a-z\d\-.]+\.[a-z]+/i);
  return match ? match[0] : null;
}

// ---- Private helpers ----

/**
 * Normalizes non-breaking spaces in message body.
 *
 * @param {string} body
 * @returns {string}
 * @private
 */
function normalizeBody(body) {
  if (!body) return '';
  return body.replace(/\u00A0/g, ' ');
}

/**
 * Formats an epoch timestamp as an IMAP date string (e.g. '16-Apr-2026').
 *
 * @param {number} epochSeconds
 * @returns {string}
 * @private
 */
function _formatImapDate(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

/**
 * Creates an IMAP connection.
 *
 * @param {Object} config
 * @returns {Imap}
 * @private
 */
function _createImapConnection(config) {
  return new Imap({
    user: config.imap_username,
    password: config.imap_password,
    host: config.imap_hostname,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });
}

/**
 * Promisified IMAP connect.
 *
 * @param {Imap} imap
 * @returns {Promise<void>}
 * @private
 */
function _imapConnect(imap) {
  return new Promise((resolve, reject) => {
    imap.once('ready', resolve);
    imap.once('error', reject);
    imap.connect();
  });
}

/**
 * Promisified IMAP openBox.
 *
 * @param {Imap} imap
 * @param {string} boxName
 * @param {boolean} readOnly
 * @returns {Promise<Object>}
 * @private
 */
function _imapOpenBox(imap, boxName, readOnly) {
  return new Promise((resolve, reject) => {
    imap.openBox(boxName, readOnly, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

/**
 * Promisified IMAP search.
 *
 * @param {Imap} imap
 * @param {Array} criteria
 * @returns {Promise<number[]>}
 * @private
 */
function _imapSearch(imap, criteria) {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

/**
 * Promisified IMAP fetch that collects all messages.
 *
 * @param {Imap} imap
 * @param {number[]} uids
 * @param {Object} fetchOptions
 * @returns {Promise<Object[]>} Array of { attrs, body }
 * @private
 */
function _imapFetch(imap, uids, fetchOptions) {
  return new Promise((resolve, reject) => {
    if (!uids || uids.length === 0) {
      resolve([]);
      return;
    }

    const messages = [];
    const fetch = imap.fetch(uids, fetchOptions);

    fetch.on('message', (msg) => {
      const item = { attrs: null, body: '' };
      const chunks = [];

      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        stream.on('end', () => {
          item.body = Buffer.concat(chunks).toString('utf8');
        });
      });

      msg.on('attributes', (attrs) => {
        item.attrs = attrs;
      });

      msg.on('end', () => {
        messages.push(item);
      });
    });

    fetch.on('error', reject);
    fetch.on('end', () => resolve(messages));
  });
}

/**
 * Promise-based sleep.
 *
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 * @private
 */
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  POLL_TIMEOUT,
  POLL_INTERVAL,
  findEmailAfter,
  searchForEmails,
  convertSearchValue,
  emailSearchCriteria,
  createEmailSearchString,
  getContactRegistrationLink,
  getEmailsAfterTimeSent,
  xOriginalToString,
  normalizeBody,
};
