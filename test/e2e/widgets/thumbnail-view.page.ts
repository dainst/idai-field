import {element, by, browser, protractor} from 'protractor';

'use strict';
const common = require('../common.js');
const delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 */
export class ThumbnailViewPage {

    // elements

    public static getThumbs() {

        browser.wait(EC.presenceOf(element(by.id('document-view-images-tab'))), delays.ECWaitTime);
        element(by.id('document-view-images-tab')).click();
        return element.all(by.css('#thumbnail-view .cell'));
    }
}