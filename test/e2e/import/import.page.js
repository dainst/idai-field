"use strict";
var Protractor_1 = require("Protractor");
'use strict';
var ImportPage = function () {
    this.getSourceOptions = function () {
        return Protractor_1.element(Protractor_1.by.id('importSourceSelect')).all(Protractor_1.by.css('select option'));
    };
    this.clickSourceOption = function (index) {
        return this.getSourceOptions().get(index).click();
    };
    this.getSourceOptionValue = function (index) {
        return this.getSourceOptions().get(index).getAttribute("value");
    };
    this.getFormatOptions = function () {
        return Protractor_1.element(Protractor_1.by.id('importFormatSelect')).all(Protractor_1.by.css('select option'));
    };
    this.clickFormatOption = function (index) {
        return this.getFormatOptions().get(index).click();
    };
    this.getFormatOptionValue = function (index) {
        return this.getFormatOptions().get(index).getAttribute("value");
    };
    this.getImportURLInput = function () {
        return Protractor_1.element(Protractor_1.by.id('importUrlInput'));
    };
    this.getMessageElement = function (index) {
        return Protractor_1.element(Protractor_1.by.id('message-' + index));
    };
    this.getMessageText = function (index) {
        return this.getMessageElement(index).getText();
    };
    this.clickImportButton = function () {
        return Protractor_1.element(Protractor_1.by.id('importButton')).click();
    };
    this.clickStartImportButton = function () {
        return Protractor_1.element(Protractor_1.by.id('importStartButton')).click();
    };
    this.get = function () {
        return Protractor_1.browser.get('/#/resources/');
    };
};
module.exports = new ImportPage();
