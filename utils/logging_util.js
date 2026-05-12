// logging_util.js

const COLORS = {
  lightBlue: '\x1b[94m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
};

function isDebug() { return !!(process.env.FW_DEBUG || process.env.DEBUG); }
function isVerbose() { return !!process.env.VERBOSE; }

function logPrefix(level) {
  const now = new Date();
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  return `[${level} ${HH}:${MM}:${SS}]`;
}

function printInfo(str) { console.log(`${COLORS.lightBlue}${logPrefix('INFO ')}${COLORS.reset} ${str}`); }
function printWarn(str) { console.warn(`${COLORS.yellow}${logPrefix('WARN ')}${COLORS.reset} ${str}`); }
function printErr(str, error = null) {
  let msg = str;
  if (error) msg += ` ${error.constructor.name}: ${error.message}`;
  console.error(`${COLORS.red}${logPrefix('ERROR')}${COLORS.reset} ${msg}`);
}
function printDebug(str) { if (isDebug()) console.log(`${COLORS.gray}${logPrefix('DEBUG')}${COLORS.reset} ${str}`); }
function printDebugVerbose(str) { if (isVerbose()) console.log(`${COLORS.gray}${logPrefix('DEBUG')}${COLORS.reset} ${str}`); }

module.exports = { printInfo, printWarn, printErr, printDebug, printDebugVerbose, isDebug, isVerbose };
