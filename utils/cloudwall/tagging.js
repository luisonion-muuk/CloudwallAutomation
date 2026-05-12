// tagging.js

const LOCATORS = {
  tag_button: '#tags-button',
  tag_popover: '#tags-button + .popover',
};

/**
 * Opens the tag popover by clicking the tag button.
 *
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} parent - Page or parent locator
 */
async function openTagPopover(parent) {
  await parent.locator(LOCATORS.tag_button).click();
}

module.exports = {
  LOCATORS,
  openTagPopover,
};
