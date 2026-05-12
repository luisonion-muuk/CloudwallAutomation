const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class for the CloudWall Posting Edit screen.
 *
 * Covers posting creation and editing including the General tab
 * and Posting Content tab fields.
 *
 * Migrated from locators previously hardcoded in:
 *   - utils/cloudwall/cloudwall_helpers.js (createPostingSimple)
 *   - tests/cloudwall/talent/talent_gather.spec.js (createOrderAndPosting)
 *   - tests/cloudwall/order/order_custom_gather_02.spec.js (pre-interview questions)
 */
class PostingEdit extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawEditPostingScreen';

  static LOCATORS = {
    // ── General tab ──
    postedByInput:        '#postedBy_input',
    postedByOption:       'div.row:has-text("Automation, Test")',
    jobLocationSelect:    'select#jobLoc',
    placementTypeSelect:  'select[name="placementType"], #placementType',

    // ── Posting Content tab ──
    postingContentTab:    'text=Posting Content',
    jobTitleInput:        'input[name="localizedDescription[0].jobTitle"]',
    cityNeighborhoodInput:'input[name="localizedDescription[0].cityNeighborhood"]',
    jobDescriptionTextarea:'textarea[name="jobDescription"], textarea[name="job_description"]',

    // ── Pre-interview questions ──
    standardQuestionCheckbox:  'input[name="standardQuestion"]',  // use with [value="36"], [value="37"], etc.
    knockoutQuestionCheckbox:  'input[name="knockoutQuestion"]',  // use with [value="1"], etc.
    customQuestionInput:       '#custom-question, textarea[name="customQuestion"], input[name="customQuestion"]',
    addQuestionBtn:            '#add-question, button:has-text("Add"), input[value="Add"]',
    saveQuestionsBtn:          '#save-questions, input[value="Save"], button:has-text("Save")',

    // ── View / Edit navigation ──
    viewPostingBtn:       'div.ButtonNormal:has-text("View Posting Detail"), a[name="AWUIDrawViewPostingScreen"]',
    editPostingBtn:       'div.ButtonNormal:has-text("Edit Posting"), a[name="AWUIDrawEditPostingScreen"]',
    saveAndPostBtn:       'div.ButtonNormal:has-text("Save & Post"), a[name="Save & Post"]',
  };

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
  }
}

module.exports = { PostingEdit };
