const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class for the CloudWall Talent Edit Detail screen.
 *
 * Covers talent creation form fields (Summary + Profile tabs),
 * Edit Placement Info (MOATS availability, phone, SMS), and
 * the datepicker for check-in dates.
 *
 * Migrated from locators previously hardcoded in:
 *   - tests/cloudwall/talent/talent_gather.spec.js
 *   - utils/cloudwall/cloudwall_helpers.js (createTalentViaUI)
 */
class TalentEditDetail extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawTalentEditDetail';

  static LOCATORS = {
    // ── Summary tab (talent creation form) ──
    email:                'input[name="email"], input#email, input[name="emailAddress"]',
    firstName:            'input[name="firstName"]',
    lastName:             'input[name="lastName"]',
    fileUpload:           'input[type="file"]',

    // ── Profile tab ──
    profileTab:           'a:has-text("Profile"), td:has-text("Profile")',
    professionalTitle:    'input[name="professional_title"]',
    profileName:          'input[name="profile_name"]',

    // ── Edit Placement Info (MOATS) ──
    editPlacementInfoBtn: 'button[data-href*="AWUIDrawTalentEditPlacementInfo"]',
    editPlacementInfoHeader: '//span[contains(text(), "Edit Placement Info")]',

    // MOATS availability radios
    moatsActiveSearchYes: 'input[name="moatsAvailActiveSearch"][value="yes"], input[name="activeSearch"][value="yes"], #moats-availability-active-search-yes',
    moatsActiveSearchNo:  'input[name="moatsAvailActiveSearch"][value="no"]',
    moatsAvailableNow:    'input[name="availabilityType"][value="now"], #moats-availability-type-available-now',

    // Check-in date (jQuery UI datepicker)
    checkinDateInput:     '#moats-snapshot-when-check-in-date',
    datepickerPrevBtn:    '#ui-datepicker-div .ui-datepicker-prev',
    datepickerDateCell:   '#ui-datepicker-div table tbody tr:nth-child(2) td:nth-child(2) a',

    // ── Phone & SMS (Profile tab in Edit Placement Info) ──
    phoneTrashButton:     '.phone-trash, .deletePhone',
    phoneInput:           'input[name="phone"], input[name="phoneNumber"]',
    addPhoneLink:         'a:has-text("Add Phone")',
    smsPreference:        'select[name="smsPreference"], #sms-preference-choice',
    smsOptInReason:       'select[name="smsOptInReason"], #sms-opt-in-reason',

    // ── Duplicate check ──
    createTalentBtn:      'div.ButtonNormal:has-text("Create Talent"), div.ButtonNormal:has-text("Create New Talent")',

    // ── MyAquent profile modal (SweetAlert2, renders on top page NOT in iframe) ──
    matModalCancelBtn:    '.swal2-cancel, button:has-text("No")',
  };

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
  }
}

module.exports = { TalentEditDetail };
