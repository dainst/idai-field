import { navigateTo, resetApp, start, stop, waitForExist, doubleClick, getByText } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { NavbarPage } from '../navbar.page';

const { test, expect } = require('@playwright/test');
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


    test('display explicitly selected draughtsman in resource view', async () => {

        await ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/' + imageFileName));

        const staffName = 'Person 1';

        await ImageOverviewPage.selectStaffAsDraughtsmen(staffName);
        await ImageOverviewPage.clickUploadConfirm();

        await waitForExist(await ImageOverviewPage.getCellByIdentifier(imageFileName));

        // Open image single view and check if staffName shows up as processor.
        await doubleClick(await ImageOverviewPage.getCellByIdentifier(imageFileName));
        await waitForExist(await getByText(staffName));
    });
});
