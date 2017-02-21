'use strict';
var common = require("../common.js");
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');


var DocumentViewPage = function() {

    this.getRelationName = function (relationIndex) {
        browser.wait(EC.visibilityOf(element(by.css('#document-view a'))), delays.ECWaitTime);
        return element.all(by.css('#document-view a')).get(relationIndex).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldValue = function (index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldName = function (index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };

    this.getFields = function() {
        browser.wait(EC.visibilityOf(element(by.css('fields-view > div'))), delays.ECWaitTime);
        return element.all(by.css('fields-view > div'))
    };

    this.getRelations = function () {
        return element.all(by.css('#document-view a'));
    };
};

module.exports = new DocumentViewPage();