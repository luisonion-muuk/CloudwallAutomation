const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the "Achievement Snapshot Invite" dialog accessed via
 * the "Capture Achievement Snapshot" ASABA on the order view detail page.
 *
 * @note order must be filled and active
 * @see OrderViewDetail
 */
class AchievementSnapshotInviteModal extends Bootstrap2Modal {

  static LOCATORS = {
    subject: '[name="subject"]',
    ckeIframe: 'iframe.cke_wysiwyg_frame',
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Waits for the CKEditor iframe to be visible before interacting.
   */
  async waitUntilReady() {
    await this.root.locator(AchievementSnapshotInviteModal.LOCATORS.ckeIframe)
      .waitFor({ state: 'visible' });
  }

  /**
   * Clears and fills the subject field with the given text.
   *
   * @param {string} text
   */
  async setSubject(text) {
    const subjectField = this.root.locator(AchievementSnapshotInviteModal.LOCATORS.subject);
    await subjectField.clear();
    await subjectField.fill(text);
  }

  /**
   * Types text into the CKEditor rich-text body by accessing the iframe's content.
   *
   * @param {string} text
   */
  async typeInBody(text) {
    const ckeIframe = this.root.locator(AchievementSnapshotInviteModal.LOCATORS.ckeIframe);
    const frame = await ckeIframe.contentFrame();
    const body = frame.locator('body');
    await body.click();
    await body.type(text);
  }
}

module.exports = { AchievementSnapshotInviteModal };
