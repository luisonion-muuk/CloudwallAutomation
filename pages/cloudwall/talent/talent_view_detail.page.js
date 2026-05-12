const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class for the CloudWall Talent View Detail screen.
 *
 * Covers the read-only talent detail view including:
 *   - Activity History tab
 *   - Correspondence tab
 *   - MOATS availability info panel
 *   - Gather response rate display
 *
 * Migrated from locators previously hardcoded in:
 *   - tests/cloudwall/talent/talent_gather.spec.js
 *   - tests/cloudwall/order/order_custom_gather_01.spec.js
 */
class TalentViewDetail extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawTalentViewDetail';

  static LOCATORS = {
    // ── Tabs ──
    activityHistoryTab:      'text=Activity History',
    correspondenceTab:       'text=Correspondence',
    profileTab:              'text=Profile',
    summaryTab:              'text=Summary',

    // ── MOATS / Availability info ──
    moatsAvailabilityInfo:       'text=Talent availability unknown',
    moatsCheckinDateLabel:       'text=Check in and resume gather date:',
    moatsLastCheckinDateLabel:   'text=Last talent check-in date',
    moatsLastUpdatedDate:        'text=Last updated',

    // ── Gather response rate (left pane) ──
    gatherResponseRateLabel: 'text=Gather response rate',
    gatherResponseRateValue: 'text=/\\d+%/',

    // ── Navigation ──
    editPlacementInfoBtn:    'button[data-href*="AWUIDrawTalentEditPlacementInfo"]',
    viewPlacementInfoAsaba:  'a[name="AWUIDrawTalentViewPlacementInfo"]',
    editPlacementInfoAsaba:  'a[name="AWUIDrawTalentEditPlacementInfo"]',

    // ── Talent module navigation ──
    talentModuleLink:        '#talent-module',
  };

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
  }

  /**
   * Navigates directly to a talent's detail page by person ID.
   *
   * @param {string} personId
   * @param {string} webHost - e.g. 'cw-pwright.aquent.io'
   */
  async navigateTo(personId, webHost) {
    await this.page.goto(`https://${webHost}/webwall/talent/${personId}`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000);
  }
}

module.exports = { TalentViewDetail };
