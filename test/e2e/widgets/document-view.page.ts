import {browser,protractor,element,by} from 'protractor';

'use strict';
var common = require("../common.js");
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
var DocumentViewPage = function() {

    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationValue = function (index) {
        browser.wait(EC.visibilityOf(element(by.css('relations-view a'))), delays.ECWaitTime);
        return element.all(by.css('relations-view a')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationName = function (index) {
        browser.wait(EC.visibilityOf(element(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return element.all(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname')).get(index).getText();
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
        return element.all(by.css('relations-view a'));
    };
};

module.exports = new DocumentViewPage();