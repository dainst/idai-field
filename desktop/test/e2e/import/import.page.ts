'use strict';

import {browser, protractor, element, by} from 'protractor';

let EC = protractor.ExpectedConditions;
let delays = require('../delays');


export class ImportPage {

    public static getSourceOptions() {

        return element(by.id('importSourceSelect')).all(by.css('select option'));
    };


    public static clickSourceOption(index) {

        return this.getSourceOptions().get(index).click();
    };


    public static getSourceOptionValue(index) {

        return this.getSourceOptions().get(index).getAttribute("value");
    };


    public static getOperationOptions() {

        browser.wait(EC.presenceOf(element(by.id('operationSelect'))), delays.ECWaitTime);
        return element(by.id('operationSelect')).all(by.css('select option'));
    };


    public static clickOperationOption(index) {

        browser.wait(EC.presenceOf(this.getOperationOptions().get(index)), delays.ECWaitTime);
        return this.getOperationOptions().get(index).click();
    };


    public static getImportURLInput() {

        return element(by.id('importUrlInput'));
    };


    public static getMessageEl(index) {

        return element(by.id('message-' + index));
    };


    public static getMessageText(index) {

        browser.wait(EC.presenceOf(this.getMessageEl(index)), delays.ECWaitTime);
        return this.getMessageEl(index).getText();
    };


    public static clickStartImportButton() {

        browser.wait(EC.visibilityOf(element(by.id('importStartButton'))), delays.ECWaitTime);
        return element(by.id('importStartButton')).click();
    };


    public static getImportModal() {

        return element(by.id('import-upload-modal'));
    };


    public static get() {

        return browser.get('#/import/');
    };
}
