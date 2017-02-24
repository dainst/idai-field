"use strict";
var Protractor_1 = require("Protractor");
'use strict';
var common = require("../common.js");
var EC = Protractor_1.protractor.ExpectedConditions;
var delays = require('../config/delays');
/**
 * @author Daniel de Oliveira
 */
var DocumentViewPage = function () {
    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationValue = function (index) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('relations-view a'))), delays.ECWaitTime);
        return Protractor_1.element.all(Protractor_1.by.css('relations-view a')).get(index).getText();
    };
    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationName = function (index) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return Protractor_1.element.all(Protractor_1.by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname')).get(index).getText();
    };
    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldValue = function (index) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };
    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldName = function (index) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };
    this.getFields = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('fields-view > div'))), delays.ECWaitTime);
        return Protractor_1.element.all(Protractor_1.by.css('fields-view > div'));
    };
    this.getRelations = function () {
        return Protractor_1.element.all(Protractor_1.by.css('relations-view a'));
    };
};
module.exports = new DocumentViewPage();
