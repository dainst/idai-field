import { closeAllMessages, navigateTo, resetApp, resetConfigJson, start, stop, typeIn, waitForMessage } from '../app';
import { NavbarPage } from '../navbar.page';
import { SettingsPage } from './settings.page';
import { ImageOverviewPage } from '../images/image-overview.page';
import { ImageViewPage } from '../images/image-view.page';

const { test } = require('@playwright/test');
const path = require('path');


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
test.describe('settings ', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
    });


    test.afterEach(async () => {

        await resetConfigJson();
    });


    test.afterAll(async () => {

        await stop();
    });


    test('show warnings if an invalid imagestore path is set', async () => {

        await SettingsPage.clickOpenAdvancedSettings();
        await typeIn(await SettingsPage.getImagestorePathInput(), '/invalid/path/to/imagestore');
        await SettingsPage.clickSaveSettingsButton();
        await waitForMessage('Das Bilderverzeichnis konnte nicht gefunden werden', false);
        await closeAllMessages();

        await navigateTo('images');
        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/logo.png'));
        await waitForMessage('Es können keine Dateien im Bilderverzeichnis gespeichert werden', false);
        await closeAllMessages();

        await ImageOverviewPage.doubleClickCell(0);
        await waitForMessage('Es können keine Dateien aus dem Bilderverzeichnis gelesen werden', false);
        await closeAllMessages();
        await ImageViewPage.clickCloseButton();

        await ImageOverviewPage.clickCell(1);
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await waitForMessage('Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden', false);
    });
});
