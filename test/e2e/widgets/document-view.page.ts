import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require("../common.js");
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class DocumentViewPage {

    // click

    public static clickRelation(relationIndex) {
        return element.all(by.css('#document-view a')).get(relationIndex).click();
    };

    public static clickEditDocument() {
        return common.click(by.id('document-view-button-edit-document'));
    };

    public static clickCreateGeometry(type) {
        return common.click(by.id('document-view-button-create-' + type));
    };

    public static clickReeditGeometry() {
        common.click(by.id('document-view-button-edit-geometry'));
    };

    public static clickSolveConflicts() {
        common.click(by.id('document-view-button-solve-conflicts'));
    };

    // get text

    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationValue(index) {
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view a')).get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view a')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationName(index) {
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname')).get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view div:nth-child(' + (index + 1) + ') .fieldname')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldValue(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldName(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))), delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };

    public static getFields() {
        browser.wait(EC.visibilityOf(element(by.css('fields-view > div'))), delays.ECWaitTime);
        return element.all(by.css('fields-view > div'))
    };

    public static getRelations() {
        browser.sleep(delays.shortRest);
        return element.all(by.css('relations-view a'));
    };

    public static getSelectedGeometryTypeText() {
        browser.wait(EC.visibilityOf(element(by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };
}