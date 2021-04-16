import { navigateTo, resetApp, resetConfigJson, start, stop, typeIn } from '../app';
import { NavbarPage } from '../navbar.page';
import { SettingsPage } from './settings.page';
import { ImageOverviewPage } from '../images/image-overview.page';
import { ImageViewPage } from '../images/image-view.page';

const path = require('path');


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('settings --', function() {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        done();
    });


    afterEach(async done => {

        await resetConfigJson();
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    it('show warnings if an invalid imagestore path is set', async done => {

        await typeIn(await SettingsPage.getImagestorePathInput(), '/invalid/path/to/imagestore');
        await SettingsPage.clickSaveSettingsButton();
        await NavbarPage.awaitAlert('Das Bilderverzeichnis konnte nicht gefunden werden', false);
        await NavbarPage.clickCloseAllMessages();

        await navigateTo('images');
        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../../../../test-data/Aldrin_Apollo_11.jpg'));
        await NavbarPage.awaitAlert('Es können keine Dateien im Bilderverzeichnis gespeichert werden', false);
        await NavbarPage.clickCloseAllMessages();

        await ImageOverviewPage.doubleClickCell(0);
        await NavbarPage.awaitAlert('Es können keine Dateien aus dem Bilderverzeichnis gelesen werden', false);
        await NavbarPage.clickCloseAllMessages();
        await ImageViewPage.clickCloseButton();

        await ImageOverviewPage.clickCell(1);
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await NavbarPage.awaitAlert('Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden', false);

        done();
    });
});
