import {browser, by, element, protractor} from "protractor";
import {ImagesGridPage} from "../images/images-grid.page";
import {ImagesViewPage} from "../images/images-view.page";
import {NavbarPage} from "../navbar.page";
import {ResourcesPage} from "../resources/resources.page";

let path = require('path');

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

describe('image grid --', function() {

    beforeEach(function () {
        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
        browser.sleep(1000);
        NavbarPage.clickNavigateToImages();
    });

    xit('image upload should create a JSON document, which in turn gets displayed in the grid', function() {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        const fileName = 'Aldrin_Apollo_11.jpg';
        const xpath = '//span[@class="badge badge-default"][text()="' + fileName + '"]';

        ImagesGridPage.clickUploadArea();
        ImagesGridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName));
        ImagesGridPage.chooseImageSubtype(0);
        browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime);
    });
});