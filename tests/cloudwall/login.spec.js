// @ts-check
const { test, expect } = require('@playwright/test');
const { visitAndLogin, visitAndLoginAs, checkGoogleAuth } = require('../../utils/modules/cloudwall');
const { Frameset } = require('../../pages/cloudwall/frameset');
const { ListScreen } = require('../../pages/cloudwall/listScreen');
const { LegacyActionScreen } = require('../../pages/cloudwall/legacy_action_screen');

const data = require('../../data/loginData.json');

const envConfig = require('../../configs/env_rcbot.json');
const testData = require('../../configs/test_data.json');
const config = {
  webHost: envConfig.server_host,
  agentUserName: testData.credentials.agent_username,
  agentPassword: testData.credentials.agent_pwd,
  ...envConfig,
};

test.describe('CloudWall Login', () => {

  test('succeeded @shallow', async ({ page }) => {
    await visitAndLogin(page, config);
    const topPage = new Frameset(page);
    await expect(topPage.rootLocator).toBeVisible();
    await checkGoogleAuth(page, config);
  });

  test('retains window key on refresh @shallow', async ({ page }) => {
    await visitAndLogin(page, config);
    const topPage = new Frameset(page);
    await expect(topPage.rootLocator).toBeVisible();
    const winkey = await topPage.getWinkey();
    expect(winkey).not.toBeNull();
    await page.reload();
    const topPageAfterRefresh = new Frameset(page);
    await expect(topPageAfterRefresh.rootLocator).toBeVisible();
    expect(await topPageAfterRefresh.getWinkey()).toBe(winkey);
  });

  test('can log in as other users @shallow', async ({ page, context }) => {
    for (const user of data.extra_users) {
      const username = user.username;
      await visitAndLoginAs(page, username, config);
      const topPage = new Frameset(page);
      await expect(topPage.rootLocator).toBeVisible();
      await topPage.openModule('talent');
      const mainPage = new ListScreen(page);
      await expect(mainPage.rootLocator).toBeVisible();
      const searchTopPage = new LegacyActionScreen(page);
      await expect(searchTopPage.rootLocator).toBeVisible();
      expect(await topPage.getUsername()).toBe(username);
      expect(await topPage.getUserPersonId()).toBe(user.person_id);
      expect(await topPage.getUserEmail()).toBe(user.email);
      await checkGoogleAuth(page, config);
      if (user.logout) {
        await searchTopPage.click('logoutLink');
      } else {
        await context.clearCookies();
      }
    }
  });

});
