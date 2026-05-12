const { LegacyActionScreen } = require('../legacy_action_screen');
const { FillOrder } = require('./quick_submit_modal');

/**
 * Page class supporting operations related to the Change Candidate Status screen.
 */
class ChangeCandidateStatus extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawChangeCandidateStatus';

  static LOCATORS = {
    candidateStatus:              '#status',
    fillOrderModal:               '#fill-order-modal',
    comments:                     'textarea[name="commentsComments"]',
    sendEmailCheckbox:            'input#emailRequest, input#invite',
    fillPendingOnboarding:        'a[title="Fill - Pending Onboarding"]',
    saveButton:                   '#link_save',
    emailSubject:                 'input#emailSubject',
    emailBody:                    'textarea#emailBody',
    emailSendButton:              'a#link_send > div',
    emailOverrideCheckbox:        '#override',
    modalYesButton:               '//button[text()="Yes"]',
    modalNoButton:                '//button[text()="No"]',
    nominatedForSubmittalModal:   '#nominated-email-modal',
    quickSubmitModal:             '#quick-submit',
  };

  static TAB_IDS = {
    candidateStatus: 'candidateStatus',
    comments:        'comments',
  };

  static STATUS_TYPES = {
    candidateExpressedInterest:    357,
    talentAppliedOnline:           10,
    contactedTalent:               20,
    contactedTalentMoreInfo:       180,
    approvedByRecruiter:           30,
    shortlistedByClient:           231,
    scheduleClientInterview:       60,
    clientInterviewComplete:       150,
    schedule2ndClientInterview:    190,
    secondClientInterviewComplete: 200,
    schedule3rdClientInterview:    210,
    thirdClientInterviewComplete:  220,
    rejectedByRecruiter:           90,
    rejectedByCandidate:           110,
    rejectedByClient:              120,
    fillOrder:                     130,
    clientOfferExtended:           242,
    clientOfferAccepted:           243,
    clientOfferRejected:           355,
    nominatedByRecruiter:          356,
  };

  /**
   * @param {import('@playwright/test').Locator} elem - The screen root element
   */
  constructor(elem) {
    super(elem);
    this.root = elem;
  }

  /**
   * Selects a candidate status type from the dropdown by its mapped value.
   *
   * @param {string} type - A key from STATUS_TYPES (e.g. 'fillOrder')
   */
  async selectCandidateStatusType(type) {
    const value = String(ChangeCandidateStatus.STATUS_TYPES[type]);
    await this.root.locator(ChangeCandidateStatus.LOCATORS.candidateStatus)
      .selectOption({ value });
  }

  /**
   * Clicks the Next tab button via ASABA link.
   */
  async clickNextButton() {
    await this.clickAsaba('tabNext');
  }

  /**
   * Clicks the Save button via ASABA link.
   */
  async clickSaveButton() {
    await this.clickAsaba('save');
  }

  /**
   * Clicks the Send button via ASABA link.
   */
  async clickSendButton() {
    await this.clickAsaba('send');
  }

  /**
   * Locates and returns a FillOrder modal instance from the fill order modal element.
   *
   * @returns {FillOrder}
   */
  findQuickFill() {
    const modalLocator = this.root.locator(ChangeCandidateStatus.LOCATORS.fillOrderModal);
    return new FillOrder(modalLocator);
  }

  static PROC_MAPPINGS = [
    'AWUIDrawChangeCandidateStatus',
    'AWUISubmitChangeCandidateStatus',
  ];
}

module.exports = { ChangeCandidateStatus };
