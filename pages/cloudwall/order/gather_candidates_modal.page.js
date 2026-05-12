const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Gather Candidates modal.
 */
class GatherCandidatesModal extends Bootstrap2Modal {

  static LOCATORS = {
    talentCounts: '//span[contains(@class, "talent-count")]',
    textGather:   '#textGather',
    emailGather:  '#emailGather',
    noEmailText:  '#cantSendEmailTextGatherListLabel',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Submits the gather modal.
   */
  async sendGather() {
    await this.submit();
  }

  /**
   * Gets the sent count from the first talent-count line.
   *
   * @returns {Promise<string>}
   */
  async sentCountFirstLine() {
    return this.root.locator(GatherCandidatesModal.LOCATORS.talentCounts).nth(0).textContent();
  }

  /**
   * Gets the sent count from the second talent-count line.
   *
   * @returns {Promise<string>}
   */
  async sentCountSecondLine() {
    return this.root.locator(GatherCandidatesModal.LOCATORS.talentCounts).nth(1).textContent();
  }

  /**
   * Gets the not-sent email count (from the second talent-count line).
   * Note: does not necessarily work for CASL applicable markets.
   *
   * @returns {Promise<string>}
   */
  async notSentEmailCount() {
    return this.root.locator(GatherCandidatesModal.LOCATORS.talentCounts).nth(1).textContent();
  }
}

module.exports = { GatherCandidatesModal };
