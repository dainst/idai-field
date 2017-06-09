import {browser, protractor, element, by} from 'protractor';

'use strict';
var common = require("../common.js");
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
var DocumentViewPage = function() {

    // click

    this.clickRelation = function(relationIndex) {
        return element.all(by.css('#document-view a')).get(relationIndex).click();
    };

    this.clickEditDocument = function() {
        browser.wait(EC.visibilityOf(element(by.id('document-view-button-edit-document'))), delays.ECWaitTime);
        element(by.id('document-view-button-edit-document')).click();
    };

    this.clickCreateGeometry = function(type) {
        browser.wait(EC.visibilityOf(element(by.id('document-view-button-create-' + type))), delays.ECWaitTime);
        return element(by.id('document-view-button-create-' + type)).click();
    };

    this.clickReeditGeometry = function() {
        browser.wait(EC.visibilityOf(element(by.id('document-view-button-edit-geometry'))), delays.ECWaitTime);
        element(by.id('document-view-button-edit-geometry')).click();
    };

    // get text

    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationValue = function(index) {
        browser.wait(EC.visibilityOf(element(by.css('relations-view a'))), delays.ECWaitTime);
        return element.all(by.css('relations-view a')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getRelationName = function(index) {
        browser.wait(EC.visibilityOf(element(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return element.all(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldValue = function(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    this.getFieldName = function(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };

    this.getFields = function() {
        browser.wait(EC.visibilityOf(element(by.css('fields-view > div'))), delays.ECWaitTime);
        return element.all(by.css('fields-view > div'))
    };

    this.getRelations = function() {
        return element.all(by.css('relations-view a'));
    };

    this.getSelectedGeometryTypeText = function() {
        //browser.wait(EC.visibilityOf(element(by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };
};

module.exports = new DocumentViewPage();