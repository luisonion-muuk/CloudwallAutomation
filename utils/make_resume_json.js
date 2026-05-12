// Migrated from: makeResumeJson.rb
// Framework: Playwright + JavaScript (from Selenium + Ruby)

const fs = require('fs');
const path = require('path');

/**
 * Guesses the MIME type based on file extension.
 *
 * @param {string} filePath
 * @returns {string}
 */
function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

/**
 * Reads a file and returns a JSON-ready object with the file name,
 * MIME type, and contents as a byte array.
 * Mirrors Ruby's ResumeJson#getResumeByte.
 *
 * @param {string} filePath - path to the resume file
 * @returns {{ fileName: string, mimeType: string, contents: number[] }}
 */
function getResumeByte(filePath) {
  const mimeType = guessMime(filePath);
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const contents = Array.from(buffer);

  return {
    fileName,
    mimeType,
    contents,
  };
}

module.exports = {
  getResumeByte,
};
