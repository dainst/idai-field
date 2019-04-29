'use strict';

import {browser, by, element, protractor} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class DetailSidebarPage {

    public static clickBackToGridButton = function () {

        return element(by.css('.detail-sidebar .close-button')).click();
    };


    public static getDocumentCard = function () {

        return element(by.css('.detail-sidebar'));
    };


    public static clickSolveConflicts() {

        common.click(element(by.css('.detail-sidebar .solve-button')));
    };


    public static doubleClickEditDocument(identifier) {

        return common.doubleClick(element(by.id('resource-' + identifier)));
    };


    // get text

    public static getIdentifier() {

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar .identifier .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('.detail-sidebar .identifier .fieldvalue')).getText();
    }


    public static getShortDescription() {

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar .short-description .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('.detail-sidebar .short-description .fieldvalue')).getText();
    }


    public static getTypeFromDocView() {

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar .type .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('.detail-sidebar .type .fieldvalue')).getText();
    }
}