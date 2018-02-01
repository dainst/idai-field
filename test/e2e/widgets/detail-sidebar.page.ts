import {browser, protractor, element, by} from 'protractor';

'use strict';
import {FieldsViewPage} from './fields-view-page';
const common = require('./common.js');
const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');

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

        common.click(element(by.css('.document-detail-sidebar .solve-button')));
    };


    public static performEditDocument() {

        FieldsViewPage.clickFieldsTab();
        return common.click(element(by.css('.detail-sidebar .edit-button')));
    };


    // get text

    public static getIdentifier() {

        browser.wait(EC.visibilityOf(element(by.css('.document-view-field-identifier'))), delays.ECWaitTime);
        return element(by.css('.document-view-field-identifier')).getText();
    }


    public static getShortDescription() {

        browser.wait(EC.visibilityOf(element(by.id('description-view-short-description'))), delays.ECWaitTime);
        return element(by.id('description-view-short-description')).getText();
    }


    public static getTypeFromDocView() {

        browser.wait(EC.visibilityOf(element(by.css('#description-view .document-view-field-type .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('#description-view .document-view-field-type .fieldvalue')).getText();
    }
}