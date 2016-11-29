'use strict';

module.exports = {
    getSourceOptions: function() {
        return element(by.id('importSourceSelect')).all(by.css('select option'));
    },
    clickSourceOption: function (index) {
        return this.getSourceOptions().get(index).click();
    },
    getSourceOptionValue: function(index) {
        return this.getSourceOptions().get(index).getAttribute("value");
    },
    getFormatOptions: function() {
        return element(by.id('importFormatSelect')).all(by.css('select option'));
    },
    clickFormatOption: function (index) {
        return this.getFormatOptions().get(index).click();
    },
    getFormatOptionValue: function(index) {
        return this.getFormatOptions().get(index).getAttribute("value");
    },
    getImportURLInput: function () {
        return element(by.id('importUrlInput'));
    },
    getMessageElement: function (index) {
        return element(by.id('message-' + index));
    },
    getMessage: function (index) {
        return this.getMessageElement(index).getText();
    },
    clickImportButton: function () {
        return element(by.id('importButton')).click();
    },
    clickStartImportButton: function () {
        return element(by.id('importStartButton')).click();
    },
    get: function () {
        browser.get('/#/resources/');
    }
};
