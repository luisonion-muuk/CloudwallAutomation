// download_util.js

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SIA_TOKEN_KEY = 'cws.authentication';

async function downloadFileFromElement(element, saveAs = null, encoding = null, page) {
  const href = await element.getAttribute('href');
  if (!href) throw new Error('Element does not have a valid "href" tag.');
  if (!saveAs) saveAs = await element.textContent();
  return await downloadFileFrom(href, saveAs, encoding, page);
}

async function downloadFileFrom(url, saveAs, encoding = null, page) {
  const headers = await createHeaderWithToken(page);
  console.log(`Downloading ${saveAs} from the url ${url}.`);
  let response;
  try {
    response = await axios.get(url, { headers, responseType: encoding === 'utf8' ? 'text' : 'arraybuffer' });
    console.log(`Downloaded ${saveAs} Successfully!`);
  } catch (e) {
    console.error(`Error occurred downloading ${saveAs} from the url ${url}.`);
    return false;
  }
  const downloadPath = path.join('tmp', 'downloads');
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });
  const filePath = path.join(downloadPath, saveAs);
  if (encoding === 'utf8') {
    fs.writeFileSync(filePath, response.data, 'utf-8');
  } else {
    fs.writeFileSync(filePath, Buffer.from(response.data));
  }
  return downloadedFileExists(saveAs);
}

async function createHeaderWithToken(page) {
  const headers = {};
  const jsessionCookie = await getJsessionIdCookie(page);
  const bearerToken = await getAuthorizationBearerToken(page);
  if (jsessionCookie) headers['Cookie'] = jsessionCookie;
  if (bearerToken) Object.assign(headers, bearerToken);
  return headers;
}

async function getJsessionIdCookie(page) {
  const context = page.context();
  const cookies = await context.cookies();
  const pageContent = await page.title().catch(() => '');
  const cookieName = pageContent.includes('CloudWall') ? 'CWSESSIONID' : 'JSESSIONID';
  const matchingCookies = cookies.filter((cookie) => cookie.name === cookieName);
  if (matchingCookies.length === 0) return null;
  const cookie = matchingCookies[0];
  return `${cookie.name}=${cookie.value}`;
}

async function getAuthorizationBearerToken(page) {
  const context = page.context();
  const cookies = await context.cookies();
  const tokenCookies = cookies.filter((cookie) => cookie.name === 'authentication');
  if (tokenCookies.length === 0) return null;
  const rawToken = tokenCookies[0].value;
  const decodedToken = decodeURIComponent(rawToken);
  const matcher = /"token":"(.*)",/;
  const match = matcher.exec(decodedToken);
  if (!match) return null;
  return { Authorization: `Bearer ${match[1]}` };
}

function downloadedFileExists(fileName) {
  return fs.existsSync(path.join('tmp', 'downloads', fileName));
}

module.exports = { SIA_TOKEN_KEY, downloadFileFromElement, downloadFileFrom, downloadedFileExists };
