import {browser, by, element, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/upload --', function() {

    // image is already present in mediastore folder since uploading does not work in HttpMediastore
    const imageUploadFileName = 'Aldrin_Apollo_11.jpg';
    const imageUploadXpath = '//span[@class="badge badge-secondary"][text()="' + imageUploadFileName + '"]';

    const uploadImage = () => {

        ImageOverviewPage.clickUploadArea();
        ImageOverviewPage.uploadImage(path.resolve(__dirname, '../../test-data/' + imageUploadFileName));
        ImageOverviewPage.chooseImageSubtype(0);
    };

    beforeEach(() => {

        ImageOverviewPage.getAndWaitForImageCells();
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid', () => {

        uploadImage();
        browser.wait(EC.presenceOf(element(by.xpath(imageUploadXpath))), delays.ECWaitTime);
    });

    it('do not allow uploading an image with a duplicate filename', () => {

        uploadImage();
        browser.wait(EC.presenceOf(element(by.xpath(imageUploadXpath))), delays.ECWaitTime);
        uploadImage();
        NavbarPage.awaitAlert('Ein Bild mit dem gleichen Dateinamen existiert bereits', false);
    });
});