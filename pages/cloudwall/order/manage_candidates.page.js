const { LegacyActionScreen } = require('../legacy_action_screen');
const { QuickSubmitModal } = require('./quick_submit_modal');
const { GatherCandidatesModal } = require('./gather_candidates_modal');
const { DuplicateOrderDialog } = require('./duplicate_order_dialog');
const { FillOrder } = require('./fill_order_modal');

/**
 * Page class supporting operations related to the Manage Candidates screen.
 */
class ManageCandidates extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawManageCandidates';

  static LOCATORS = {
    // Top-level
    candidateStagesFrame:          '#CandidateStages',
    viewOrderDetailButton:         'a[title="Order Detail"] > div',
    talentPoolDetails:             '//a/div[contains(text(), "Talent Pool Details")]',
    gatherModal:                   '#gather-modal',
    payRate:                       '//*[@id="TabPage"]/div[2]/table/tbody/tr[1]/td[3]/a',
    orderStartDate:                '#order-start-date',
    duplicateOrderModal:           '#duplicate-order-modal',
    interviewCandidateDialog:      '#interview-candidate-dialog',
    interviewCandidateDialogSave:  '#interview-candidate-dialog-save',
    interviewCandidateDialogCancel:'#interview-candidate-dialog-cancel',
    editPdfBtn:                    '#edit-pdf-btn',
    candidateStagesTab:            'td[tabId="CandidateStages"]',
    copyCandidates:                'a#link_copyCandidates > div',
    quickSearch:                   '#quickSearch',
    quickSubmitModal:              '#quick-submit',
    fillOrderModal:                '#fill-order-modal',
    advancedSearch:                '#advancedSearch',
    universalSearch:               '#ftSearch',
    vmsToggle:                     '[name="vms-toggle"]',
    visitMacLink:                  '//a[contains(text(), "Click here to visit MAC")]',
    submitToClientButton:          '#link_submitToClient > div',
    candidateInfoCloseButton:      'a.close-button',
    messageCandidateFrame:         'iframe[id*="messageCandidate"]',
    subject:                       '#subject-input',
    orderHeader:                   '.RecordLabel',
    aquentsBookFrame:              'iframe[id*="AquentsBook"]',
    aquentsBookTab:                'td[tabId="AquentsBook"]',
    diversityTooltipIcon:          '#diversity-goal-tooltip>#diversity-goal-tooltip-icon',
    diversityTooltipText:          '#diversity-goal-tooltip>.tooltip-text',
    zipCodeRadiusSearch:           'input[value="zip"]',
    zipCodeInput:                  '[name="ftZipCode"]',
    jobTrackerWidgetRow:           '.jobTrackerWidget',

    // Fields
    fieldJsiPar:                       '[name="par"]',
    fieldJsiNotes:                     '[name="notes"]',
    fieldJsiMoats:                     '[name="moats"]',
    fieldJsiMoatsChanged:              '[name="moatsChanged"]',
    fieldQuickSearchLastName:          '[name="last_name"]',
    fieldQuickSearchPersonId:          '[name="person_id"]',
    fieldQuickSearchMarket:            '#qs_market_id',
    fieldCsMoneyInputMinimum:          '#moneyMin',
    fieldCsMoneyInputMaximum:          '#moneyMax',
    fieldCsOpportunityContractCheckBox:'#contractCheckBox',
    fieldCsAvailabilityConfirmedSince: '#confirmedAvailability',
    fieldCsTransportationRadiusZip:    '#homeLocationSearch',
    fieldCsTransportationRadiusValue:  '#distanceSearch',
    fieldFullTextSearchTermsAs:        '[name="resKeywords"]',
    fieldFullTextSearchTermsUs:        '[name="ft_resKeywords"]',
    fieldPracticeGroup:                '[name="segment"]',
    fieldTalentStatus:                 '[name="talent_status"]',
    fieldMatchesDiversityGoalAs:       '[name="diversityGoalSearch"]',
    fieldMatchesDiversityGoalUs:       '[name="ft_diversityGoalSearch"]',
    fieldEmailSubject:                 '[name="subject"]',
    fieldQueryField:                   '#queryField',
    fieldAquentsBookSearchInput:       '#search-term-input',

    // Card search
    csCard:                          '.card',
    csGoogleLoginButton:             '#card_search_google_login_button',
    csAdvancedSearchDropdown:        '//*[@id="TabPage"]/form/div/div[1]/i',
    csAdvancedSearchCloseDropdown:   '//*[@id="TabPage"]/form/div/div[2]/i',
    csAdvancedSearchClear:           '//*[@id="TabPage"]/form/div/div[2]/a',
    csAdvancedSearchSubmitInForm:    '//*[@id="TabPage"]/form/div/div[2]/button/i',
    csQueryField:                    '#queryField',
    csQueryFieldSubmitButton:        '//*[@id="TabPage"]/form/button',
    csDateAvailable:                 '#availabilityDate',
    csIncludeNotLooking:             '#notLookingCheckBox',
    csExcludeCurrentlyWorking:       '#excludeCurrentlyWorkingCheckBox',
    csAdvancedSearchSubmit:          '#search-button-query-bar',
    csResultsMessage:                '#search-result-content',
    csProgressMeter:                 '#progress-meter',
    csLoginButton:                   '#card_search_google_login_button',
    csAvailabilityDate:              '#availabilityDate',
    csConfirmedAvailability:         '#confirmedAvailability',
    csSubmittedToSimilarOrdersCheckbox: '#submittedToSimilarOrders',
    csClearSearchParametersButton:   'a.clear',
    csMakeCandidate:                 'div.actions > a',
    csSelectedCardsActionButtons:    '#selected-actions',
    csProfileLink:                   'a.link',
    csIncludeAllStatuses:            '#all',
    csProfessionalHeadline:          '.title',
    csViewProfileButton:             '.view-profile',
    csCandidateStatus:               '.status',
    csReviewStarClass:               '.qccStar',
    csReviewButton:                  'div.qcc > div.review-link > a',

    // Card search — MOATS/comments
    csToggleButton:                  '.toggle-link',
    csShowCommentsToggle:            '.fa-comments',
    csShowMoatsToggle:               '.moats-toggle',
    csCommentsAgentSummary:          '.more',
    csMoats:                         '.moats',
    csMoatsOpportunity:              '.opportunity',
    csMoatsOpportunitySelection:     '.fa',
    csMoatsTravelHomeMarket:         '.travel',
    csMoatsMoneyRateAndSalary:       '.money',
    csMoatsAvailabilityRow:          '.availability',

    // Submittal history
    shRow:                           '#submittal-history-table table tbody tr',
    shViewProfileButton:             './/a[contains(text(), "View Profile")]',
    shColumnDate:                    'td:nth-child(1)',
    shColumnTalent:                  'td:nth-child(2)',
    shColumnPayRate:                 'td:nth-child(3)',
    shColumnBillRate:                'td:nth-child(4)',
    shColumnProfile:                 'td:nth-child(5)',
    shColumnDetails:                 'td:nth-child(6)',
    shColumnViewPdf:                 'td:nth-child(6) a',
    shColumnDetailsBtn:              'td:nth-child(6) .btn',
    shEmailModalContent:             '#submittalEmailModal .modal-body .content',
    shEmailModalViewCompleteProfiles:'//*[@id="submittalEmailModal"]//div[5]/a[contains(text(), "View Complete Profiles")]',
    shDiversityGoal:                 '.diversity-goal',
    shRequestHelpButton:             '#requestHelpButton',

    // Candidate info
    ciFrame:                         '#candidateInfo',
    ciTalentName:                    '#talent-name',
    ciPdfContainer:                  '#pdfContainer',
    ciPdfPages:                      '#pdfContainer > canvas',
    ciTabs:                          '//div[@mattablabelwrapper]',
    ciQuestionText:                  '.question-text',
    ciAnswerText:                    '.answer-text',
    ciUnansweredQuestion:            '#unanswered-questions li',
    ciNoData:                        '.no-data-text',
    ciNextCandidateArrow:            '#paginator-arrow-forward.enabled',
    ciPreviousCandidateArrow:        '#paginator-arrow-back.enabled',
    ciEmailButton:                   '.req-vms-info.questions.answered-questions button',
    ciLeftTabArrow:                  '.mat-mdc-tab-header-pagination-before',
    ciRightTabArrow:                 '.mat-mdc-tab-header-pagination-after',
    ciPayRate:                       '//*[@id="pay-rate-div"]/div[1]/b',

    // Candidate info — submittals
    ciRightToRepresent:              '.vms-content-signed-pdf',
    ciDobInfo:                       '.candidate-validation-info .dob-info',
    ciTaxInfo:                       '.candidate-validation-info .tax-id',
    ciEmploymentDates:               '.employment-history .dates-of-employment',
    ciEmploymentType:                '.employment-history .employment-type',
    ciManagerName:                   '.employment-history .manager-name',
    ciTitle:                         '.employment-history .title',
    ciDepartment:                    '.employment-history .department',
    ciPreviousClient:                '.employment-history .previous-client',

    // Job tracker widget
    jtFrame:                         '#jobTrackerWidgetFrame',
    jtChipSet:                       '.job-tracker-chip',

    // Aquents Book
    abCwTalentCard:                  'app-portfolio-card.cw_talent',
    abTopSearchResult:               '//app-portfolio-card[@class="cw_talent ng-star-inserted"]',
    abTalentNameOnCard:              '.talent-name',
    abScrollToTopButton:             'img[id*="back-to-top"]',
    abActionBarSendGather:           'app-action-bar .right-group button#send-gather-button',
    abActionBarMakeCandidateButton:  'app-action-bar .action-button.add-to-order',
    abMakeCandidateButton:           '#make-candidate-button',
    abCandidateBadge:                'app-candidate-badge',
    abGatherSnackbarContent:         '#gatherSnackBarContent',
    abGatherSnackbarContentActionBar:'#gatherSnackBarContentActionBar',
    abSendGatherLink:                '.portfolio-card .talent-actions button#send-gather-button',
    abTalentResultImg:               'app-portfolio-card .card-body .talent-images img',
    abTalentEmailLink:               '.info-container .content a',
    abCardSelectButton:              'aq-checkbox.card-select__checkbox',
    abCloseButton:                   'mat-sidenav-content app-icon-button.close',
    abCardContent:                   '.mat-card-content',

    // Aquents Book — talent pane
    abTalentPaneName:                '#cwTalentDetail',
    abTalentPanePinIcon:             '.pin-talent-button',
    abTalentPaneMakeCandidateButton: '//*[@id="makeCandidate"]/div/span',
    abTalentPanePhoneIcon:           '//i[contains(text(), "phone")]',
    abTalentPaneEmailIcon:           '//i[contains(text(), "email")]',
    abTalentPaneResumeIcon:          '//i[contains(text(), "description")]',
    abTalentPaneAvailabilityIcon:    '//i[contains(text(), "date_range")]',
    abTalentPaneLocationIcon:        '//i[contains(text(), "location_on")]',
    abTalentPanePayRateIcon:         '//i[contains(text(), "monetization_on")]',

    // Aquents Book — faceted filter
    abFilterAvailabilityDateInput:      '#availability-input',
    abFilterAvailabilityUpdatedInput:   '#availability-updated-dropdown input',
    abFilterAvailabilityUpdatedOption:  '#availability-updated-dropdown div .ng-option',
    abFilterGoogleLocationInput:        '#google-location-input',
    abFilterMarketInput:                '#market-input input',
    abFilterMarketOption:               '#market-input div .ng-option',
    abFilterMarketXButton:              '//*[@id="market-input"]/div/div/div[2]/span[1]',
    abFilterSegmentInput:               '#segment-input input',
    abFilterSegmentOption:              '#segment-input div .ng-option',
    abFilterMatOption:                  'mat-option[id*="mat-option-"]',
    abFilterApply:                      '#faceted-search-apply',
    abFilterClear:                      '#faceted-search-clear-all',
    abFilterMinHourly:                  '#min-hourly-input',
    abFilterMaxHourly:                  '#max-hourly-input',
    abFilterMinYearly:                  '#min-yearly-input',
    abFilterMaxYearly:                  '#max-yearly-input',
    abFilterSelectedMarkets:            '.market-container ng-select',
    abFilterOpportunityTypeDropdown:    '.type-container',
    abFilterOpportunityCheckbox:        '.select-one-opportunity-type',
    abFilterOpportunityTemp:            '#moats_contract',
    abFilterOpportunityTempToPerm:      '#moats_contract_to_hire',
    abFilterOpportunityPerm:            '#moats_permanent',
    abFilterOpportunityFullTime:        '#moats_full_time',
    abFilterOpportunityPartTime:        '#moats_part_time',
    abFilterOpportunityOnSite:          '#moats_on_site',
    abFilterOpportunityOffSite:         '#moats_off_site',
    abFilterSelectedMinorSegments:      '.segment-container ng-select',
    abFilterPreviouslyPlaced:           '#previously-placed-facet',
    abFilterSubmittedToSimilar:         '#submitted-to-similar-orders-facet',
    abFilterSelectedAvailabilityUpdated:'#availability-updated-dropdown',
    abFilterApplyButton:                '#faceted-search-apply .button-content',
  };

  static TAB_IDS = {
    currentCandidates: 'CurrentCandidates',
    candidateStages:   'CandidateStages',
    searchCriteria:    'CandidateSearchCriteria',
    searchResults:     'SearchResults',
    cardSearch:        'CardSearch',
    aquentsBook:       'AquentsBook',
  };

  static FIELDS = {
    talentStatus:             { type: 'multiCheckbox' },
    practiceGroup:            { type: 'multiCheckbox' },
    quickSearchPersonId:      { type: 'text' },
    quickSearchMarket:        { type: 'select' },
    queryField:               { type: 'text' },
    aquentsBookSearchInput:   { type: 'text' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawManageCandidates',
    'AWUISubmitManageCandidates',
  ];

  /**
   * @param {import('@playwright/test').Page} page
   * @param {Object} config
   */
  constructor(page, config) {
    super(page, config);
    this.page = page;
  }

  // --- Field helpers ---

  /**
   * Clears and fills a field by its locator key.
   *
   * @param {string} fieldKey - A key from LOCATORS prefixed with 'field'
   * @param {string} content
   */
  async setFieldContent(fieldKey, content) {
    const field = this.page.locator(ManageCandidates.LOCATORS[fieldKey]);
    await field.clear();
    await field.fill(content);
  }

  /**
   * Gets the current value of a field.
   *
   * @param {string} fieldKey
   * @returns {Promise<string>}
   */
  async getFieldContent(fieldKey) {
    return this.page.locator(ManageCandidates.LOCATORS[fieldKey]).inputValue();
  }

  /**
   * Clicks a field element.
   *
   * @param {string} fieldKey
   */
  async clickField(fieldKey) {
    await this.page.locator(ManageCandidates.LOCATORS[fieldKey]).click();
  }

  // --- Interview dialog ---

  async submitSaveInterview() {
    await this.page.locator(ManageCandidates.LOCATORS.interviewCandidateDialogSave).click();
  }

  async submitCancelInterview() {
    await this.page.locator(ManageCandidates.LOCATORS.interviewCandidateDialogCancel).click();
  }

  async waitForSaveInterviewToComplete() {
    await this.page.locator(ManageCandidates.LOCATORS.interviewCandidateDialog)
      .waitFor({ state: 'hidden', timeout: 5000 });
  }

  // --- Quick search ---

  /**
   * Runs a quick search by last name or person ID.
   *
   * @param {string|number} searchParameter - Person ID (number) or last name (string)
   */
  async runQuickSearch(searchParameter) {
    await this.switchTab('searchCriteria');
    await this.page.locator(ManageCandidates.LOCATORS.quickSearch).click();

    if (typeof searchParameter === 'number') {
      await this.setFieldContent('fieldQuickSearchPersonId', String(searchParameter));
    } else {
      await this.setFieldContent('fieldQuickSearchLastName', searchParameter);
    }

    await this.clickAsaba('executeSearch');
  }

  /**
   * Runs a quick search across all markets.
   *
   * @param {string|number} searchParameter
   */
  async runAllMarketsQuickSearch(searchParameter) {
    await this.switchTab('searchCriteria');
    await this.page.locator(ManageCandidates.LOCATORS.quickSearch).click();

    if (typeof searchParameter === 'number') {
      await this.setFieldContent('fieldQuickSearchPersonId', String(searchParameter));
    } else {
      await this.setFieldContent('fieldQuickSearchLastName', searchParameter);
    }

    await this.page.locator(ManageCandidates.LOCATORS.fieldQuickSearchMarket).selectOption('');
    await this.clickAsaba('executeSearch');
  }

  /**
   * Runs an advanced search filtered for RTW talent.
   */
  async runRtwAdvancedSearch() {
    await this.switchTab('searchCriteria');
    await this.page.locator(ManageCandidates.LOCATORS.advancedSearch).click();
    await this.setField('talentStatus', ['readyToWork', 'newInterviewComplete']);
    await this.clickAsaba('executeSearch');
  }

  // --- Quick submit ---

  /**
   * Opens the quick submit modal.
   *
   * @returns {QuickSubmitModal}
   */
  async openQuickSubmit() {
    await this.clickSubmitToClientButton();
    return new QuickSubmitModal(this.page.locator(ManageCandidates.LOCATORS.quickSubmitModal));
  }

  /**
   * Performs a quick submit using existing data, only modifying the email subject.
   *
   * @param {string} timestamp
   */
  async quickSubmitWithExistingData(timestamp) {
    await this.clickSubmitToClientButton();
    const modal = new QuickSubmitModal(this.page.locator(ManageCandidates.LOCATORS.quickSubmitModal));
    await modal.clickNextButton();
    await modal.setEmailSubject(`quick submit ${timestamp}`);
    await modal.clickSubmitButton();
  }

  /**
   * Performs a quick submit with a specified pay rate (bill rate = pay rate + 20).
   *
   * @param {string} timestamp
   * @param {number} [payRate=30]
   */
  async quickSubmitWithPayRate(timestamp, payRate = 30) {
    const billRate = payRate + 20;
    await this.clickSubmitToClientButton();
    const modal = new QuickSubmitModal(this.page.locator(ManageCandidates.LOCATORS.quickSubmitModal));
    await modal.setPayRate(String(payRate));
    await modal.setBillRate(String(billRate));
    await modal.clickNextButton();
    await modal.setEmailSubject(`quick submit ${timestamp}`);
    await modal.clickSubmitButton();
  }

  // --- Gather ---

  /**
   * Opens the gather candidates modal.
   *
   * @returns {GatherCandidatesModal}
   */
  async openGather() {
    await this.clickAsaba('gather');
    return new GatherCandidatesModal(this.page.locator(ManageCandidates.LOCATORS.gatherModal));
  }

  // --- Candidate info ---

  async openCandidateInfo() {
    await this.clickAsaba('openCandidateInfo');
    await this.switchToCandidateInfoFrame();
  }

  async openPdfEdit() {
    await this.page.locator(ManageCandidates.LOCATORS.editPdfBtn).click();
    return new QuickSubmitModal(this.page.locator(ManageCandidates.LOCATORS.quickSubmitModal));
  }

  // --- Card search ---

  /**
   * Waits for card search results to finish loading (up to 120s).
   */
  async waitCardSearchResults() {
    await Promise.race([
      this.page.locator(ManageCandidates.LOCATORS.csProgressMeter).waitFor({ state: 'hidden', timeout: 120000 }),
      this.page.locator(ManageCandidates.LOCATORS.csLoginButton).waitFor({ state: 'visible', timeout: 120000 }),
    ]);
  }

  /**
   * Gets the card search query field value.
   *
   * @returns {Promise<string>}
   */
  async csQuery() {
    return this.page.locator(ManageCandidates.LOCATORS.csQueryField).inputValue();
  }

  /**
   * Gets an array of talent IDs from displayed card search results.
   *
   * @returns {Promise<string[]>}
   */
  async getIdListForDisplayedTalent() {
    const cards = this.page.locator(ManageCandidates.LOCATORS.csCard);
    const count = await cards.count();
    const ids = [];
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).locator('a.view-profile').getAttribute('href');
      ids.push(href.split('/').pop());
    }
    return ids;
  }

  /**
   * Gets an array of talent names from displayed card search results.
   *
   * @returns {Promise<string[]>}
   */
  async getNameListForDisplayedTalent() {
    const cards = this.page.locator(ManageCandidates.LOCATORS.csCard);
    const count = await cards.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(await cards.nth(i).locator('div.primary-name').textContent());
    }
    return names;
  }

  /**
   * Gets talent names from the email form.
   *
   * @returns {Promise<string[]>}
   */
  async getNameListForEmailTalent() {
    const forms = this.page.locator('div.email-form');
    const count = await forms.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(await forms.nth(i).locator('div.items').textContent());
    }
    return names;
  }

  /**
   * Clicks an action button for selected cards.
   *
   * @param {string} actionSelector - CSS selector for the action button
   */
  async clickActionButtonsSelectedCards(actionSelector) {
    const actionButtons = this.page.locator(ManageCandidates.LOCATORS.csSelectedCardsActionButtons);
    await actionButtons.locator(actionSelector).click();
  }

  async clickSendEmailForSelectedTalents() {
    await this.page.locator('div.email-form').locator('button[type="submit"], input[type="submit"]').click();
  }

  /**
   * Checks whether a card's select/deselect button text matches expectations.
   *
   * @param {number} cardIndex
   * @param {boolean} checkForSelect - true to check it's selected, false for deselected
   */
  async checkSingleCardSelectDeselect(cardIndex, checkForSelect) {
    const card = this.page.locator(ManageCandidates.LOCATORS.csCard).nth(cardIndex);
    const buttonText = await card.locator('.select').textContent();
    if (checkForSelect) {
      expect(buttonText.trim()).toBe('Deselect');
      await expect(this.page.locator(ManageCandidates.LOCATORS.csSelectedCardsActionButtons)).toBeVisible();
    } else {
      expect(buttonText.trim()).toBe('Select');
    }
  }

  /**
   * Selects multiple cards, then deselects all via the deselect button.
   *
   * @param {number[]} cardIndexArr
   */
  async multipleCardsSelectDeselect(cardIndexArr) {
    for (const index of cardIndexArr) {
      await this.checkSingleCardSelectDeselect(index, true);
    }
    await this.clickActionButtonsSelectedCards('button.deselect');
    for (const index of cardIndexArr) {
      await this.checkSingleCardSelectDeselect(index, false);
    }
    await expect(this.page.locator(ManageCandidates.LOCATORS.csSelectedCardsActionButtons)).not.toBeVisible();
  }

  /**
   * Clicks send or dismiss on the gather dialog for selected talents.
   *
   * @param {Object} [opts={}]
   * @param {boolean} [opts.dismiss=false]
   */
  async clickSendGatherForSelectedTalents({ dismiss = false } = {}) {
    const gatherDialog = this.page.locator(ManageCandidates.LOCATORS.gatherModal);
    const buttons = gatherDialog.locator('button.btn-primary');
    if (dismiss) {
      await buttons.nth(1).click(); // Close button
    } else {
      await buttons.nth(0).click(); // Send gather button
    }
  }

  /**
   * Checks a candidate's status on the current candidates tab.
   *
   * @param {string} checkForId - Talent ID
   * @param {string} checkWith - Expected status text
   */
  async checkCandidateRowContent(checkForId, checkWith) {
    await this.switchTab('currentCandidates');
    const rowContent = await this.currentCandidates.getContentForRow(checkForId);
    expect(rowContent.candidateStatus).toBe(checkWith);
  }

  /**
   * Gets the text listing of talents sent gather emails.
   *
   * @returns {Promise<string>}
   */
  async sentGatherEmailsTalents() {
    const gatherDialog = this.page.locator(ManageCandidates.LOCATORS.gatherModal);
    return gatherDialog.locator('#emailGatherList').textContent();
  }

  /**
   * Checks talent links (resume or portfolio) on a card.
   *
   * @param {number} talentCardIdx
   * @param {string} checkFor - 'Resume' or 'Portfolio'
   */
  async checkTalentLinks(talentCardIdx, checkFor) {
    let linkIdx = 0;
    let checkStrUrl = '/resume';
    if (checkFor === 'Portfolio') {
      linkIdx = 1;
      checkStrUrl = '/portfolio-url';
    }

    let linkFound = false;
    while (!linkFound) {
      const selectedCard = this.page.locator(ManageCandidates.LOCATORS.csCard).nth(talentCardIdx);
      const linkText = await selectedCard.locator(ManageCandidates.LOCATORS.csProfileLink).nth(linkIdx).textContent();
      if (linkText.trim() === checkFor) {
        linkFound = true;

        const selectedTalentIds = await this.getIdListForDisplayedTalent();
        const selectedTalentId = selectedTalentIds[talentCardIdx];
        const actualLink = await selectedCard.locator(ManageCandidates.LOCATORS.csProfileLink).nth(linkIdx).getAttribute('href');
        const expectedLink = `redirect/talent/${selectedTalentId}${checkStrUrl}`;
        expect(actualLink).toContain(expectedLink);
      } else {
        talentCardIdx++;
      }
    }
  }

  /**
   * Interacts with a candidate card by clicking an action element.
   *
   * @param {number} cardIndex
   * @param {string} actionClass - CSS class of the action element
   */
  async interactWithCandidateFromCardSearchResult(cardIndex, actionClass) {
    const card = this.page.locator(ManageCandidates.LOCATORS.csCard).nth(cardIndex);
    await card.locator(`.${actionClass}`).click();
  }

  /**
   * Gets review data from the first card with reviews, then clicks into that card.
   *
   * @returns {Promise<Object>} { numReviews, cumulativeRatingStarClass }
   */
  async getReviewDataAndClickCard() {
    const cards = this.page.locator(ManageCandidates.LOCATORS.csCard);
    const numCards = await cards.count();
    const result = {};

    for (let i = 0; i < numCards; i++) {
      const reviewAnchor = cards.nth(i).locator(ManageCandidates.LOCATORS.csReviewButton);
      const text = await reviewAnchor.textContent();

      if (text.trim().length > 0) {
        result.numReviews = parseInt(text.replace(/\D/g, ''), 10);

        const starClassAttr = await cards.nth(i).locator(ManageCandidates.LOCATORS.csReviewStarClass).getAttribute('class');
        const starClasses = starClassAttr.split(' ').filter(cls =>
          cls.startsWith('one') || cls.startsWith('two') || cls.startsWith('three') ||
          cls.startsWith('four') || cls.startsWith('five')
        );
        result.cumulativeRatingStarClass = starClasses.length > 0 ? starClasses[0] : 'noStarClassFound';

        await reviewAnchor.click();
        break;
      }
    }

    return result;
  }

  // --- Submit to client ---

  async clickSubmitToClientButton() {
    const button = this.page.locator(ManageCandidates.LOCATORS.submitToClientButton);
    await button.waitFor({ state: 'visible', timeout: 2000 });
    await button.click();
  }

  // --- Card search advanced ---

  async clickAdvancedSearchDropdown() {
    await this.page.locator(ManageCandidates.LOCATORS.csAdvancedSearchDropdown).click();
  }

  async clearAdvancedSearchDropdown() {
    await this.page.locator(ManageCandidates.LOCATORS.csClearSearchParametersButton).click();
  }

  async includeAllStatuses() {
    await this.clickAdvancedSearchDropdown();
    await this.page.locator(ManageCandidates.LOCATORS.csIncludeAllStatuses).click();
    await this.page.locator(ManageCandidates.LOCATORS.csAdvancedSearchSubmit).click();
    await this.waitCardSearchResults();
  }

  /**
   * Runs a card search query.
   *
   * @param {string} cardSearchQuery
   */
  async runCardSearchQuery(cardSearchQuery) {
    await this.setFieldContent('fieldQueryField', cardSearchQuery);
    await this.page.locator(ManageCandidates.LOCATORS.csQueryFieldSubmitButton).click();
    await this.waitCardSearchResults();
  }

  /**
   * Gets all candidate card elements.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCardSearchArray() {
    return this.page.locator(ManageCandidates.LOCATORS.csCard);
  }

  // --- Duplicate order ---

  /**
   * Opens the duplicate order dialog.
   *
   * @returns {DuplicateOrderDialog}
   */
  async openDuplicate() {
    await this.clickAsaba('duplicateOrder');
    return new DuplicateOrderDialog(this.page.locator(ManageCandidates.LOCATORS.duplicateOrderModal));
  }

  /**
   * Checks whether the quick submit modal is currently displayed.
   *
   * @returns {Promise<boolean>}
   */
  async quickSubmitModalDisplayed() {
    const bodyClasses = await this.page.locator('body').getAttribute('class');
    return bodyClasses?.includes('modal-open') ?? false;
  }

  /**
   * Returns a FillOrder modal instance.
   *
   * @returns {FillOrder}
   */
  findQuickFill() {
    return new FillOrder(this.page.locator(ManageCandidates.LOCATORS.fillOrderModal));
  }

  // --- Candidate info frame ---

  async clickTalentName() {
    await this.switchToCandidateInfoFrame();
    const frame = this.page.frameLocator(ManageCandidates.LOCATORS.ciFrame);
    await frame.locator(ManageCandidates.LOCATORS.ciTalentName).click();
  }

  async switchToCandidateInfoFrame() {
    const frame = this.page.frameLocator(ManageCandidates.LOCATORS.ciFrame);
    await frame.locator(ManageCandidates.LOCATORS.ciTalentName).waitFor({ state: 'visible' });
  }

  // --- Aquents Book ---

  /**
   * Switches to the Aquents Book iframe and returns a FrameLocator.
   *
   * @returns {import('@playwright/test').FrameLocator}
   */
  getAquentsBookFrame() {
    return this.page.frameLocator(ManageCandidates.LOCATORS.aquentsBookFrame);
  }

  /**
   * Clears filters, performs a search in Aquents Book, and waits for results.
   *
   * @param {string} searchQuery
   */
  async performSearchAquentsBook(searchQuery) {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abCardContent).waitFor({ state: 'visible', timeout: 15000 });

    await this.clearFiltersAquentsBook();

    const searchInput = frame.locator(ManageCandidates.LOCATORS.fieldAquentsBookSearchInput);
    await searchInput.clear();
    await searchInput.fill(searchQuery);

    await frame.locator(ManageCandidates.LOCATORS.abFilterApply).click();
    await this.waitUntilAquentsBookTalentLoaded();
  }

  async clearFiltersAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abFilterClear).waitFor({ state: 'visible' });
    await frame.locator(ManageCandidates.LOCATORS.abFilterClear).click();
    await this.waitUntilAquentsBookTalentLoaded();
  }

  async waitUntilAquentsBookLoaded() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abCardContent).waitFor({ state: 'visible' });
  }

  async waitUntilAquentsBookTalentLoaded() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abCwTalentCard).first().waitFor({ state: 'visible' });
  }

  /**
   * Counts displayed talent cards in Aquents Book.
   *
   * @returns {Promise<number>}
   */
  async countTalentAquentsBook() {
    const frame = this.getAquentsBookFrame();
    return frame.locator('app-portfolio-card').count();
  }

  /**
   * Gets the talent ID from the first Aquents Book search result.
   *
   * @returns {Promise<string>}
   */
  async getFirstTalentIdAquentsBook() {
    const frame = this.getAquentsBookFrame();
    return frame.locator(ManageCandidates.LOCATORS.abTopSearchResult).getAttribute('id');
  }

  async closeTalentPaneAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abCloseButton).click();
  }

  /**
   * Clicks the select button on the nth talent card (1-indexed).
   *
   * @param {number} num
   */
  async clickCardSelectButtonAquentsBook(num) {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abCardSelectButton).nth(num - 1).click();
  }

  /**
   * Clicks the make candidate button on the nth talent card (1-indexed).
   *
   * @param {number} num
   */
  async clickCardMakeCandidateButtonAquentsBook(num) {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abMakeCandidateButton).nth(num - 1).click();
    await frame.locator(ManageCandidates.LOCATORS.abCandidateBadge).waitFor({ state: 'visible' });
  }

  async clickActionBarGatherAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abActionBarSendGather).waitFor({ state: 'visible' });
    await frame.locator(ManageCandidates.LOCATORS.abActionBarSendGather).click();
  }

  async clickActionBarMakeCandidateButtonAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abActionBarMakeCandidateButton).click();
    await frame.locator(ManageCandidates.LOCATORS.abCandidateBadge).waitFor({ state: 'visible' });
  }

  async selectSubmittedToSimilarAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abFilterSubmittedToSimilar).click();
  }

  async applyAndValidateFiltersAquentsBook() {
    const frame = this.getAquentsBookFrame();
    const applyBtn = frame.locator(ManageCandidates.LOCATORS.abFilterApplyButton);
    await expect(applyBtn).toBeEnabled();
    await applyBtn.click();
    await this.waitUntilAquentsBookTalentLoaded();
  }

  /**
   * Clicks into a talent's CW profile from Aquents Book (1-indexed).
   *
   * @param {number} index
   */
  async goToCwProfileAquentsBook(index) {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abTalentNameOnCard).nth(index - 1).click();
  }

  /**
   * Clicks the send gather link on the nth talent card (1-indexed).
   *
   * @param {number} num
   */
  async clickSendGatherLinkAquentsBook(num) {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abSendGatherLink).nth(num - 1).click();
  }

  /**
   * Gets the talent email address from Aquents Book.
   *
   * @returns {Promise<string>}
   */
  async getTalentEmailAddressAquentsBook() {
    const frame = this.getAquentsBookFrame();
    await frame.locator(ManageCandidates.LOCATORS.abTalentEmailLink).first().waitFor({ state: 'visible', timeout: 120000 });

    const links = frame.locator(ManageCandidates.LOCATORS.abTalentEmailLink);
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href?.startsWith('mailto:')) {
        return links.nth(i).textContent();
      }
    }
    return '';
  }
}

module.exports = { ManageCandidates };
