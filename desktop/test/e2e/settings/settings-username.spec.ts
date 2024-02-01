import { navigateTo, resetConfigJson, start, stop, waitForExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { SettingsPage } from './settings.page';
import { UpdateUsernameModalPage } from './update-username-modal.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('settings/username --', () => {

    test.afterEach(async () => {

        await resetConfigJson();
        await stop();
    });


    test('enter username in update username modal on startup', async () => {

        await start({ config: { dbs: ['test'] } });
        await waitForExist(await UpdateUsernameModalPage.getBody());

        await UpdateUsernameModalPage.typeInUsername('ABC');
        await UpdateUsernameModalPage.clickConfirm();

        expect(await NavbarPage.getUsername()).toEqual('ABC');
    });


    test('change username in update username modal', async () => {

        await start();
        expect(await NavbarPage.getUsername()).toEqual('Test-User');

        await NavbarPage.clickUsernameButton();
        await UpdateUsernameModalPage.typeInUsername('ABC');
        await UpdateUsernameModalPage.clickConfirm();

        expect(await NavbarPage.getUsername()).toEqual('ABC');
    });


    test('change username in settings', async () => {

        await start();
        expect(await NavbarPage.getUsername()).toEqual('Test-User');

        await navigateTo('settings');
        await SettingsPage.typeInUsername('ABC');
        await SettingsPage.clickSaveSettingsButton();

        expect(await NavbarPage.getUsername()).toEqual('ABC');
    });
});
