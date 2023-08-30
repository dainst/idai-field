import { navigateTo, resetApp, start, stop, waitForExist } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { NavbarPage } from '../navbar.page';

const { test } = require('@playwright/test');
const path = require('path');


test.describe('images/upload --', () => {

    // image is already present in mediastore folder since uploading does not work in HttpMediastore
    const imageFileName: string = 'logo.png';


    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('images');
        await ImageOverviewPage.waitForCells();
    });


    test.afterAll(async () => {

        await stop();
    });

    test('image upload should create a JSON document, which in turn gets displayed in the grid', async () => {

        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/' + imageFileName));
        await ImageOverviewPage.clickUploadConfirm();

        await waitForExist(await ImageOverviewPage.getCellByIdentifier(imageFileName));
    });


    test('do not allow uploading an image with a duplicate filename', async () => {

        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/' + imageFileName));
        await ImageOverviewPage.clickUploadConfirm();

        await waitForExist(await ImageOverviewPage.getCellByIdentifier(imageFileName));

        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/' + imageFileName));
        await ImageOverviewPage.clickUploadConfirm();

        await NavbarPage.awaitAlert('Ein Bild mit dem gleichen Dateinamen existiert bereits', false);
    });
});
