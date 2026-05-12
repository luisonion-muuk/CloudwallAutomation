const { Bootstrap2Modal } = require('../../elements/bootstrap2_modal');

/**
 * Page class supporting operations related to the Quick Submit modal.
 */
class QuickSubmitModal extends Bootstrap2Modal {

  static LOCATORS = {
    loading:                        '.loader-container',

    // Inputs
    payRate:                        '#payRate',
    billRate:                       '#billRate',
    notes:                          '.notes',
    salary:                         '.salary',

    // Action buttons
    nextButton:                     '//*[@id="quick-submit"]//button[contains(text(), "Next")]',
    finishButton:                   '//*[@id="quick-submit"]//button[contains(text(), "Finish")]',
    submitButton:                   '//*[@id="quick-submit"]//button[contains(text(), "Send")]',
    saveButton:                     '//*[@id="quick-submit"]//button[contains(text(), "Save")]',
    closeButton:                    '//*[@id="quick-submit"]//button[contains(text(), "Close")]',
    cancelButton:                   '//*[@id="quick-submit"]//button[contains(text(), "Cancel")]',
    backButton:                     '//*[@id="quick-submit"]//button[contains(text(), "Back")]',
    saveAndComposeEmail:            '//*[@id="quick-submit"]//button[contains(text(), "Compose Email")]',
    saveAndCreatePdf:               '#saveCreatePDF',
    send:                           '//*[@id="quick-submit"]//button[contains(text(), "Send")]',

    // Email
    emailIframe:                    'iframe[title="Rich Text Editor, editor1"]',
    emailSubject:                   '#qs-subject',
    emailBody:                      'body',

    // Misc
    positionDetailLink:             'input.htkUrlInput',
    talentNames:                    '.name.ng-binding',
    talentNamesCandidateStages:     'td.name.ng-binding',
    talentProfileLinks:             'input.talentUrlInput',

    // PDF fields
    pdfTalentName:                  '#talent-name',
    pdfTitle:                       '#jobTitle',
    pdfBillRate:                    '#billRateHr',
    pdfPortfolio0:                  '#portfolio-0',
    pdfPortfolio1:                  '#portfolio-1',
    pdfPortfolio2:                  '#portfolio-2',
    pdfPortfolio3:                  '#portfolio-3',
    pdfPortfolio4:                  '#portfolio-4',
    pdfPortfolio5:                  '#portfolio-5',
    pdfPortfolio6:                  '#portfolio-6',
    pdfPortfolio7:                  '#portfolio-7',
    pdfPortfolio8:                  '#portfolio-8',
    pdfPortfolio9:                  '#portfolio-9',
    pdfAddAnotherLink:              '#addAnotherLink',
    pdfResumeName:                  '#candidate-summary-resume-name',
    pdfJobSummaryLink:              '#job-summary-link',
    pdfJobSummaryLinkAiTemplate:    '#job-summary-review-link',
    pdfJobSummaryContent:           '#job-summary-content',
    pdfCandidateSummaryEditor:      '#cke_candidateSummary',
    pdfHighlight0:                  '#highlight-0',
    pdfHighlight1:                  '#highlight-1',
    pdfHighlight2:                  '#highlight-2',
    pdfHighlight3:                  '#highlight-3',
    pdfHighlight4:                  '#highlight-4',
    pdfAddAnotherHighlight:         '#addAnotherHighlight',
    pdfSelectedResumeFile:          '#selectedResumeFile',
    pdfAvailableInterview:          '#availableInterview',
    pdfAvailableStart:              '#availableStart',
    pdfHomeLocation:                '#homeLocation',
    pdfStars:                       '#stars',
    pdfIncludeReviews:              '[name="includeReviews"]',
    pdfIncludeAssessments:          '[name="includeAssessments"]',
    pdfIncludeReviewsYes:           '.include-text input[name="includeReviews"][value="true"]',
    pdfIncludeReviewsNo:            '.include-text input[name="includeReviews"][value="false"]',
    pdfIncludeAssessmentsYes:       '.include-text input[name="includeAssessments"][value="true"]',
    pdfIncludeAssessmentsNo:        '.include-text input[name="includeAssessments"][value="false"]',
    pdfNoReviews:                   '#no_reviews',
    pdfNoAssessments:               '#no_assessments',
    pdfPreviewPdf:                  '.preview-pdf',
    pdfWillingToRelocate:           '#willingToRelocate',
    pdfAdditionalFile1:             '#additionalFile1',
    pdfAdditionalFile2:             '#additionalFile2',
    pdfAdditionalFile1Name:         '#additional-file-1-name',
    pdfAdditionalFile2Name:         '#additional-file-2-name',
    pdfRemoveFile1:                 '#remove-file-1',
    pdfRemoveFile2:                 '#remove-file-2',
    pdfAdditionalFileButton:        '#additionalFileButton',
    pdfJobSummaryDiv:               '#job-summary-div',

    // PDF confirm
    pdfConfirmHeader:               '//h3[contains(text(), "Success!")]',
    pdfLink:                        'a',
    noReviews:                      '#no_reviews',
    noAssessments:                  '#no_assessments',
    candidateSubmittalTemplate:     '#candidate-summary-template',
    vmsCandidateSummaryContainer:   'div.vms-candidate-summary-container',
    pdfContinueWithoutAttachmentsAlert: '#continue-without-attachments-alert-container',

    // PDF header section
    pdfHeaderContainer:             '#header-section-container',
    pdfHeaderFields:                '.header-field',
    pdfAddFieldButton:              '#add-header-field',
    pdfNameHeaderTitle:             '#header-1-title',
    pdfNameHeaderInput:             '#header-1-value-input',
    pdfLocationHeaderTitle:         '#header-2-value-title',
    pdfLocationHeaderInput:         '#header-2-value-input',
    pdfAvailableInterviewHeader:    '#header-3-field',
    pdfAvailableInterviewHeaderTitle: '#header-3-value-title',
    pdfAvailableInterviewHeaderInput: '#header-3-value-input',
    pdfAvailableInterviewTrashCan:  '#header-3-trash-can',
    pdfPastExperienceHeaderTitle:   '#header-4-title',
    pdfPastExperienceYesRadio:      '#header-4-yes-radio',
    pdfPastExperienceNoRadio:       '#header-4-no-radio',
    pdfEmailAtClientField:          '#header-5-field',
    pdfEmailAtClientTitle:          '#header-5-title',
    pdfEmailAtClientInput:          '#header-5-value-input',
    pdfPortfolioHeader:             '#header-7-field',
    pdfPortfolioHeaderInput:        '#url-header-7-input',
    pdfPortfolioTrashCan:           '#header-7-trash-can',
    pdfNewFieldHeader:              '#header-8-field',
    pdfNewFieldTitleInput:          '#header-8-title',
    pdfNewFieldValueInput:          '#header-8-value-input',
    pdfNewFieldTrashCan:            '#header-8-trash-can',

    // PDF body section
    pdfBodySectionTitle:            '.section-title-inner-container > .section-title',
    pdfAddSectionButton:            '#add-new-section-button',
    pdfDeleteSectionButton:         '.trashcan',
    pdfFirstSection:                '#section-content-html-0',
    pdfFirstSectionTitleInput:      '#section-title-input-0',
    pdfFirstSectionContentInput:    '#section-title-input-0 > .ai-generated-vms-candidate-summary',
    pdfFirstSectionContainer:       '#section-0',
    pdfFirstSectionEditorContainer: '#section-editor-container-0',
    pdfSecondSectionContainer:      '#section-1',
    pdfSecondSectionEditorContainer:'#section-editor-container-1',
    pdfThirdSectionContainer:       '#section-2',
    pdfThirdSectionEditorContainer: '#section-editor-container-2',
    pdfFourthSectionContainer:      '#section-3',
    pdfFourthSectionEditorContainer:'#section-editor-container-3',
    pdfFifthSectionContainer:       '#section-4',
    pdfFifthSectionEditorContainer: '#section-editor-container-4',
  };

  /**
   * Dynamic selectors that accept an index parameter.
   */
  static SELECTORS = {
    headerTitleInput:    (i) => `#header-${i}-title`,
    headerValueInput:    (i) => `#header-${i}-value-input`,
    sectionTitle:        (i) => `#section-title-${i}`,
    sectionTitleInput:   (i) => `#section-title-input-${i}`,
    sectionContentInput: (i) => `#section-editor-container-${i} > div`,
    sectionContentBody:  (i) => `#section-content-html-${i}`,
    sectionCheckbox:     (i) => `#section-select-${i}`,
    selectedSection:     '#selected-section',
    moveSectionUpBtn:    (i) => `#section-move-up-${i}`,
    moveSectionDownBtn:  (i) => `#section-move-down-${i}`,
    deleteSectionBtn:    (i) => `#section-delete-${i}`,
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The modal root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Waits for the loading indicator to disappear.
   */
  async waitForLoad() {
    await this.root.locator(QuickSubmitModal.LOCATORS.loading)
      .waitFor({ state: 'hidden', timeout: 60000 });
  }

  // --- Button clicks ---

  async clickNextButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.nextButton).click();
  }

  async clickFinishButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.finishButton).click();
  }

  async clickSubmitButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.submitButton).click();
  }

  async clickSaveButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.saveButton).click();
  }

  async clickCloseButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.closeButton).click();
  }

  async clickCancelButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.cancelButton).click();
  }

  async clickBackButton() {
    await this.root.locator(QuickSubmitModal.LOCATORS.backButton).click();
  }

  // --- Input helpers ---

  /**
   * @param {string} rate
   */
  async setPayRate(rate) {
    const field = this.root.locator(QuickSubmitModal.LOCATORS.payRate);
    await field.clear();
    await field.fill(rate);
  }

  /**
   * @param {string} rate
   */
  async setBillRate(rate) {
    const field = this.root.locator(QuickSubmitModal.LOCATORS.billRate);
    await field.clear();
    await field.fill(rate);
  }

  /**
   * @param {string} subject
   */
  async setEmailSubject(subject) {
    await this.root.locator(QuickSubmitModal.LOCATORS.emailSubject).fill(subject);
  }

  // --- PDF section dynamic methods ---

  /**
   * Clicks into a PDF section body to enter edit mode.
   *
   * @param {number} index
   */
  async enterEditModeForPdfSection(index) {
    await this.root.locator(QuickSubmitModal.SELECTORS.sectionContentBody(index)).click();
  }

  /**
   * @param {number} headerIndex
   * @param {string} text
   */
  async setHeaderTitle(headerIndex, text) {
    const field = this.root.locator(QuickSubmitModal.SELECTORS.headerTitleInput(headerIndex));
    await field.clear();
    await field.fill(text);
  }

  /**
   * @param {number} headerIndex
   * @param {string} text
   */
  async setHeaderValue(headerIndex, text) {
    const field = this.root.locator(QuickSubmitModal.SELECTORS.headerValueInput(headerIndex));
    await field.clear();
    await field.fill(text);
  }

  /**
   * Checks whether a PDF section is displayed (either content body or editor).
   *
   * @param {number} index
   * @returns {Promise<boolean>}
   */
  async sectionIsDisplayed(index) {
    const bodyCount = await this.root.locator(QuickSubmitModal.SELECTORS.sectionContentBody(index)).count();
    const inputCount = await this.root.locator(QuickSubmitModal.SELECTORS.sectionContentInput(index)).count();
    return bodyCount > 0 || inputCount > 0;
  }

  /**
   * @param {number} headerIndex
   * @param {string} text
   */
  async setPdfSectionTitle(headerIndex, text) {
    const field = this.root.locator(QuickSubmitModal.SELECTORS.sectionTitleInput(headerIndex));
    await field.clear();
    await field.fill(text);
  }

  /**
   * Sets PDF section content via the CKEditor iframe.
   *
   * @param {number} index
   * @param {string} text
   */
  async setPdfSectionContent(index, text) {
    const editorContainer = this.root.locator(QuickSubmitModal.SELECTORS.sectionContentInput(index));
    const iframe = editorContainer.locator('iframe');
    const frame = await iframe.contentFrame();
    const body = frame.locator('body');
    await body.click();
    await body.clear();
    await body.type(text);
  }

  /**
   * Gets PDF section content text.
   *
   * @param {number} index
   * @returns {Promise<string>}
   */
  async getPdfSectionContent(index) {
    const bodyLocator = this.root.locator(QuickSubmitModal.SELECTORS.sectionContentBody(index));
    if (await bodyLocator.count() > 0) {
      return bodyLocator.textContent();
    }
    // Fall back to reading from the editor iframe
    const editorContainer = this.root.locator(QuickSubmitModal.SELECTORS.sectionContentInput(index));
    const iframe = editorContainer.locator('iframe');
    const frame = await iframe.contentFrame();
    return frame.locator('body').textContent();
  }

  /**
   * @param {number} index
   * @returns {Promise<string>}
   */
  async getPdfSectionTitle(index) {
    return this.root.locator(QuickSubmitModal.SELECTORS.sectionTitle(index)).textContent();
  }

  /**
   * @param {number} index
   */
  async movePdfSectionUp(index) {
    await this.root.locator(QuickSubmitModal.SELECTORS.moveSectionUpBtn(index)).click();
  }

  /**
   * @param {number} index
   */
  async movePdfSectionDown(index) {
    await this.root.locator(QuickSubmitModal.SELECTORS.moveSectionDownBtn(index)).click();
  }

  /**
   * Deletes a PDF section and confirms the dialog.
   *
   * @param {number} index
   */
  async deletePdfSection(index) {
    await this.root.locator(QuickSubmitModal.SELECTORS.deleteSectionBtn(index)).click();
    await this.root.page().keyboard.press('Enter');
  }

  /**
   * Checks whether a section title has the "selected" class.
   *
   * @param {number} index
   * @returns {Promise<boolean>}
   */
  async isSectionChecked(index) {
    const classes = await this.root.locator(QuickSubmitModal.SELECTORS.sectionTitle(index)).getAttribute('class');
    return (classes || '').includes('selected-section');
  }

  /**
   * Ensures a section checkbox is checked.
   *
   * @param {number} index
   */
  async checkSection(index) {
    if (await this.isSectionChecked(index)) {
      await this.root.locator(QuickSubmitModal.SELECTORS.sectionCheckbox(index)).click();
    }
  }

  /**
   * Ensures a section checkbox is unchecked.
   *
   * @param {number} index
   */
  async uncheckSection(index) {
    if (!(await this.isSectionChecked(index))) {
      await this.root.locator(QuickSubmitModal.SELECTORS.sectionCheckbox(index)).click();
    }
  }

  // --- Quick submit compose email flow ---

  async processQuickSubmitComposeEmail() {
    await this.root.locator(QuickSubmitModal.LOCATORS.payRate).fill('30');
    const billField = this.root.locator(QuickSubmitModal.LOCATORS.billRate);
    await billField.clear();
    await billField.fill('50');
    await this.root.locator(QuickSubmitModal.LOCATORS.saveAndComposeEmail).click();
    await this.root.locator(QuickSubmitModal.LOCATORS.emailSubject).fill('Automated Test Quick Submit');
    await this.root.locator(QuickSubmitModal.LOCATORS.submitButton).click();
  }

  // --- VMS content ---

  /**
   * @param {Object} content
   * @param {string} content.payRate
   * @param {string} content.billRate
   * @param {string} content.notes
   */
  async setVmsContent(content) {
    const payField = this.root.locator(QuickSubmitModal.LOCATORS.payRate);
    await payField.clear();
    await payField.fill(content.payRate);
    const billField = this.root.locator(QuickSubmitModal.LOCATORS.billRate);
    await billField.clear();
    await billField.fill(content.billRate);
    await this.root.locator(QuickSubmitModal.LOCATORS.notes).fill(content.notes);
  }

  // --- Email body (iframe) ---

  /**
   * Types text into the email body CKEditor iframe.
   *
   * @param {string} text
   * @param {string|null} [dataRole=null] - Optional data-role attribute to target a specific field
   */
  async typeInEmailBody(text, dataRole = null) {
    const iframe = this.root.locator(QuickSubmitModal.LOCATORS.emailIframe);
    const frame = await iframe.contentFrame();
    const body = frame.locator('body.cke_editable');

    if (dataRole == null) {
      await body.type(text);
    } else {
      await frame.locator(`[data-role='${dataRole}']`).click();
      await frame.locator(`[data-role='${dataRole}']`).press('End');
      await frame.locator(`[data-role='${dataRole}']`).type(text);
    }
  }

  /**
   * Searches the email body for specific text content.
   *
   * @param {string} searchText
   * @returns {Promise<boolean>}
   */
  async searchEmailBodyForContent(searchText) {
    const iframe = this.root.locator(QuickSubmitModal.LOCATORS.emailIframe);
    const frame = await iframe.contentFrame();
    const bodyText = await frame.locator('body.cke_editable').textContent();
    return bodyText.includes(searchText);
  }

  // --- Template selection ---

  /**
   * Selects a candidate submittal template by index.
   *
   * @param {number} templateIndex
   */
  async selectCandidateSubmittalTemplate(templateIndex) {
    const select = this.root.locator(QuickSubmitModal.LOCATORS.candidateSubmittalTemplate);
    const options = select.locator('option');
    const value = await options.nth(templateIndex).getAttribute('value');
    await select.selectOption(value);
  }
}

module.exports = { QuickSubmitModal };
