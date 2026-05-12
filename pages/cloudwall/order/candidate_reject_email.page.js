const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Candidate Reject Email screen.
 */
class CandidateRejectEmail extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawSendEmailCandidateRejection';

  static TAB_IDS = {
    rejectEmail: 'email',
  };

  static LOCATORS = {
    form:            '#emailForm',
    recipients:      '#recipTo',
    recipientInput:  '#recipToInput',
    ccRecip:         '#recipCcInput',
    bccRecip:        '#recipBccInput',
    emailSubject:    '#emailSubject',
    emailBody:       'textarea[name="emailBody"]',
    sendButton:      'a#link_send > div',
  };

  static FIELDS = {
    recipientInput: { tab: 'rejectEmail', type: 'text' },
  };

  static PROC_MAPPINGS = [
    'AWUIDrawSendEmailCandidateRejection',
    'AWUISubmitSendEmailCandidateRejection',
  ];
}

module.exports = { CandidateRejectEmail };
