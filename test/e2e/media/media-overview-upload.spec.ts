import {browser, protractor} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {NavbarPage} from '../navbar.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


describe('media/media-overview/upload --', () => {

    // image is already present in mediastore folder since uploading does not work in HttpMediastore
    const imageUploadFileName: string = 'Aldrin_Apollo_11.jpg';


    const uploadImage = () => {

        MediaOverviewPage.clickUploadArea();
        MediaOverviewPage.uploadFile(path.resolve(__dirname, '../../test-data/' + imageUploadFileName));
        MediaOverviewPage.chooseImageSubtype(0);
    };


    beforeEach(() => {

        MediaOverviewPage.getAndWaitForImageCells();
    });


    it('image upload should create a JSON document, which in turn gets displayed in the grid', () => {

        uploadImage();
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier(imageUploadFileName)),
            delays.ECWaitTime);
    });


    it('do not allow uploading an image with a duplicate filename', () => {

        uploadImage();
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier(imageUploadFileName)),
            delays.ECWaitTime);
        uploadImage();
        NavbarPage.awaitAlert('Eine Ressource mit dem gleichen Dateinamen existiert bereits', false);
    });
});