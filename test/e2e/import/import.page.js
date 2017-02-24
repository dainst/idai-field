'use strict';

var ImportPage = function (){
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
    this.getMessageElement = function (index) {
        return element(by.id('message-' + index));
    };
    this.getMessageText = function (index) {
        return this.getMessageElement(index).getText();
    };
    this.clickImportButton = function () {
        return element(by.id('importButton')).click();
    };
    this.clickStartImportButton = function () {
        return element(by.id('importStartButton')).click();
    };
    this.get = function () {
        return browser.get('/#/resources/');
    };
};

module.exports = new ImportPage();