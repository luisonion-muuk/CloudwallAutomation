const { ActionScreen } = require('../action_screen');

/**
 * Page class supporting operations related to the PeopleNet Export screen.
 */
class PeopleNetExportScreen extends ActionScreen {

  static PATH = '/peoplenet/view';

  static LOCATORS = {
    vmsSelect:   '#vmsIds',
    downloadBtn: '.btn',
  };

  static PATH_MAPPINGS = [
    '/peoplenet/view',
  ];
}

module.exports = { PeopleNetExportScreen };
