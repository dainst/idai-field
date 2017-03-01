import {browser,protractor,element,by} from 'protractor';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

'use strict';

let ImportPage = function (){
    this.getSourceOptions = function() {
        return element(by.id('importSourceSelect')).all(by.css('select option'));
    };
    this.clickSourceOption = function (index) {
        return this.getSourceOptions().get(index).click();
    };
    this.getSourceOptionValue = function(index) {
        return this.getSourceOptions().get(index).getAttribute("value");
    };
    this.getFormatOptions = function() {
        return element(by.id('importFormatSelect')).all(by.css('select option'));
    };
    this.clickFormatOption = function (index) {
        return this.getFormatOptions().get(index).click();
    };
    this.getFormatOptionValue = function(index) {
        return this.getFormatOptions().get(index).getAttribute("value");
    };
    this.getImportURLInput = function () {
        return element(by.id('importUrlInput'));
    };
    this.getMessageEl = function (index) {
        return element(by.id('message-' + index));
    };
    this.getMessageText = function (index) {
        browser.wait(EC.presenceOf(this.getMessageEl(index)), delays.ECWaitTime);
        return this.getMessageEl(index).getText();
    };
    this.clickImportButton = function () {
        browser.wait(EC.visibilityOf(element(by.id('importButton'))), delays.ECWaitTime);
        return element(by.id('importButton')).click();
    };
    this.clickStartImportButton = function () {
        browser.wait(EC.visibilityOf(element(by.id('importStartButton'))), delays.ECWaitTime);
        return element(by.id('importStartButton')).click();
    };
    this.get = function () {
        return browser.get('/#/resources/');
    };
};

module.exports = new ImportPage();