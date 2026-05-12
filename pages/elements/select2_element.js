/**
 * Helper class for interacting with Select2 dropdown elements in CloudWall.
 *
 * Migrated from the Ruby Select2 element class.
 * Select2 replaces native <select> elements with a searchable dropdown widget.
 */
class Select2 {
  /**
   * @param {import('@playwright/test').Locator} rootLocator - Locator for the Select2 container
   */
  constructor(rootLocator) {
    this.root = rootLocator;
  }

  /**
   * Opens the Select2 dropdown.
   */
  async open() {
    await this.root.locator('.select2-choice, .select2-selection').click();
  }

  /**
   * Types into the Select2 search field and selects the first matching result.
   *
   * @param {string} text - Text to search for
   * @param {number} [timeout=5000]
   */
  async searchAndSelect(text, timeout = 5000) {
    await this.open();
    const searchInput = this.root.page().locator('.select2-search input, .select2-search__field');
    await searchInput.fill(text);
    await searchInput.page().waitForTimeout(1000);
    const firstResult = this.root.page().locator('.select2-results .select2-result-selectable, .select2-results__option').first();
    await firstResult.waitFor({ state: 'visible', timeout });
    await firstResult.click();
  }

  /**
   * Gets the currently selected text.
   *
   * @returns {Promise<string>}
   */
  async selectedText() {
    return this.root.locator('.select2-chosen, .select2-selection__rendered').textContent();
  }

  /**
   * Clears the current selection.
   */
  async clear() {
    const clearBtn = this.root.locator('.select2-search-choice-close, .select2-selection__clear');
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
    }
  }
}

module.exports = { Select2 };
