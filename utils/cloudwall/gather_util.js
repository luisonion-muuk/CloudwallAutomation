// gather_util.js

const path = require('path');

/**
 * Enters EEOC data on the gather form if on the eeoc-form page.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function enterEeocDataGather(page) {
  if (page.url().includes('eeoc-form')) {
    await page.waitForSelector('#genderSelect', { timeout: 20000 });
    await page.selectOption('#genderSelect', '1');
    await page.click('#lgbtq-yes');
    await page.selectOption('#ethnicitySelect', '4');
    await page.selectOption('#ageGroupSelect', '3');
    await page.click('#veteran-yes');
    await page.click('#self-disability-identification-no');
    await page.click('#neruodivergent-yes');
    await page.click('#authorize-to-work-us-yes');
    await page.click('#requires-sponsorship-yes');
    await page.click('.submit');

    // Switch back to main frame (equivalent of switch_to.default_content)
    const mainFrame = page.mainFrame();
    await mainFrame.waitForURL(/confirm/, { timeout: 30000 });
  }
}

/**
 * Enters pre-interview answers on the gather form.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} customQuestionAnswer - Answer for the custom question
 */
async function enterPreInterviewAnswers(page, customQuestionAnswer) {
  await page.waitForSelector('#answers-submit', { timeout: 15000 });

  // Auth to work in US
  await page.click('input#mat-radio-2-input');
  // Visa Sponsorship
  await page.click('input#mat-radio-5-input');
  // Custom Question
  await page.fill('.question textarea', customQuestionAnswer);
  await page.click('#answers-submit');
  await page.waitForTimeout(5000);

  if (!page.url().includes('eeoc-form')) {
    await page.waitForSelector('//button/span[contains(text(), "Visit Job Center")]', { timeout: 15000 });
  }
}

/**
 * Checks for the availability screen and fills it out if present.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {boolean} hasPreInterviewQuestions - Whether the gather has pre-interview questions
 * @param {string} testTimeString - Timestamp string for uniqueness
 */
async function checkForAvailabilityScreen(page, hasPreInterviewQuestions, testTimeString) {
  await Promise.race([
    page.waitForSelector('#availability', { timeout: 15000 }).catch(() => null),
    page.waitForSelector('//button/span[contains(text(), "Visit Job Center")]', { timeout: 15000 }).catch(() => null),
  ]);

  const availabilityPrompt = await page.$('#availability');
  if (availabilityPrompt) {
    await availabilityPrompt.selectOption('immediately');
    await page.waitForTimeout(1000);

    await page.fill('#personUriId_0', '');
    await page.fill('#personUriId_0', `Gather Portfolio${testTimeString}.com`);
    await setResumeValue(page, '//div[contains(@class,"resume-upload")]//input[@type="file"]');

    if (hasPreInterviewQuestions) {
      await page.click('//button/span[contains(text(), "Next")]');
    } else {
      await page.click('//button/span[contains(text(), "Confirm")]');
    }

    await page.waitForTimeout(5000);

    if (!page.url().includes('eeoc-form') && !page.url().includes('pre-interview-questions')) {
      await page.waitForSelector('//button/span[contains(text(), "Visit Job Center")]', { timeout: 15000 });
    }
  }
}

/**
 * Sets the resume file upload value.
 *
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} selector - XPath or CSS selector for the file input element
 */
async function setResumeValue(page, selector) {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(path.resolve('basic_resume.pdf'));
}

module.exports = {
  enterEeocDataGather,
  enterPreInterviewAnswers,
  checkForAvailabilityScreen,
  setResumeValue,
};
