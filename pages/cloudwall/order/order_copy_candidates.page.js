const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Order Copy Candidates screen.
 */
class CopyCandidatesScreen extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawOrderCopyCandidates';

  static LOCATORS = {
    orderIdSearch:  '[name="orderID"]',
    isOnlyMyOrders: '#isOnlyMyOrders',
    go:             'a#link_runSearch > span',
  };

  static PROC_MAPPINGS = [
    'AWUIDrawOrderCopyCandidates',
  ];
}

module.exports = { CopyCandidatesScreen };
