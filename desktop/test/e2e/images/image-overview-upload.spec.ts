import {browser, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../delays');
const common = require('../common');


describe('images/upload --', () => {

    // image is already present in mediastore folder since uploading does not work in HttpMediastore
    const imageUploadFileName: string = 'Aldrin_Apollo_11.jpg';


    const uploadImage = () => {

        ImageOverviewPage.clickUploadArea();
        ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../../../test-data/' + imageUploadFileName));
        ImageOverviewPage.chooseImageSubcategory(0);
    };


    beforeEach(() => {

        browser.sleep(1000);

        MenuPage.navigateToSettings();
        common.resetApp();
        MenuPage.navigateToImages();
        ImageOverviewPage.waitForCells();
    });


    it('image upload should create a JSON document, which in turn gets displayed in the grid', () => {

        uploadImage();
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier(imageUploadFileName)),
            delays.ECWaitTime);
    });


    it('do not allow uploading an image with a duplicate filename', () => {

        uploadImage();
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier(imageUploadFileName)),
            delays.ECWaitTime);
        uploadImage();
        NavbarPage.awaitAlert('Ein Bild mit dem gleichen Dateinamen existiert bereits', false);
    });
});
