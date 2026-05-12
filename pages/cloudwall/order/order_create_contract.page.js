const { LegacyActionScreen } = require('../legacy_action_screen');

/**
 * Page class supporting operations related to the Order Create Contract screen.
 */
class CreateContract extends LegacyActionScreen {

  static PROC_NAME = 'AWUIDrawOrderCreateContract';

  static TAB_IDS = {
    createContract: 'Create Contract',
  };

  static LOCATORS = {
    recordLabel:                             '.RecordLabel',
    successMessage:                          '#successMessage',
    orderRecordsSuccessfullyUpdatedValue:    '//*[@id="createContract"]/table/tbody/tr[1]/td[2]',
    orderRecordsFailedWhenUpdatedValue:      '//*[@id="createContract"]/table/tbody/tr[2]/td[2]',
    talentRecordsSuccessfullyUpdatedValue:   '//*[@id="createContract"]/table/tbody/tr[3]/td[2]',
    talentRecordsFailedWhenUpdatedValue:     '//*[@id="createContract"]/table/tbody/tr[4]/td[2]',
  };

  static PROC_MAPPINGS = [
    'AWUIDrawOrderCreateContract',
  ];
}

module.exports = { CreateContract };
