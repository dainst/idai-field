import {browser, protractor, element, by} from 'protractor';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

'use strict';

export class ImportPage {

    public static getSourceOptions = function() {
        return element(by.id('importSourceSelect')).all(by.css('select option'));
    };

    public static clickSourceOption = function(index) {
        return this.getSourceOptions().get(index).click();
    };

    public static getSourceOptionValue = function(index) {
        return this.getSourceOptions().get(index).getAttribute("value");
    };

    public static getFormatOptions = function() {
        return element(by.id('importFormatSelect')).all(by.css('select option'));
    };

    public static clickFormatOption = function(index) {
        return this.getFormatOptions().get(index).click();
    };

    public static getFormatOptionValue = function(index) {
        return this.getFormatOptions().get(index).getAttribute("value");
    };

    public static getMainTypeDocumentOptions = function() {
        browser.wait(EC.presenceOf(element(by.id('mainTypeDocumentSelect'))), delays.ECWaitTime);
        return element(by.id('mainTypeDocumentSelect')).all(by.css('select option'));
    };

    public static clickMainTypeDocumentOption = function(index) {
        browser.wait(EC.presenceOf(this.getMainTypeDocumentOptions().get(index)), delays.ECWaitTime);
        return this.getMainTypeDocumentOptions().get(index).click();
    };

    public static getImportURLInput = function() {
        return element(by.id('importUrlInput'));
    };

    public static getMessageEl = function(index) {
        return element(by.id('message-' + index));
    };

    public static getMessageText = function(index) {
        browser.wait(EC.presenceOf(this.getMessageEl(index)), delays.ECWaitTime);
        return this.getMessageEl(index).getText();
    };

    public static clickStartImportButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('importStartButton'))), delays.ECWaitTime);
        return element(by.id('importStartButton')).click();
    };

    public static get = function() {
        return browser.get('#/import/');
    };
}