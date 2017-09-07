import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class DocumentViewPage {

    // click

    public static clickRelation(relationIndex) {
        this.clickRelationsTab();
        return element.all(by.css('#document-view-relations-tab-panel .relation-target')).get(relationIndex).click();
    };

    public static clickRelationsTab() {
        element(by.id('document-view-relations-tab')).click();
    }

    public static clickGeometryTab() {
        element(by.id('document-view-geometry-tab')).click();
    }

    public static clickEditDocument() {
        return common.click(element(by.id('document-view-button-edit-document')));
    };

    public static clickCreateGeometry(type) {
        this.clickGeometryTab();
        return common.click(element(by.id('document-view-button-create-' + type)));
    };

    public static clickReeditGeometry() {
        this.clickGeometryTab();
        common.click(element(by.id('document-view-button-edit-geometry')));
    };

    public static clickSolveConflicts() {
        common.click(element(by.id('document-view-button-solve-conflicts')));
    };

    // get text

    public static getShortDescription() {
        browser.wait(EC.visibilityOf(element(by.id('description-view-short-description'))), delays.ECWaitTime);
        return element(by.id('description-view-short-description')).getText();
    }

    public static getTypeCharacter() {
        browser.wait(EC.visibilityOf(element(by.css('.document-info .card-header div.type-icon'))), delays.ECWaitTime);
        return element(by.css('.document-info .card-header div.type-icon')).getText();
    }

    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationValue(index) {
        this.clickRelationsTab();
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view .title')).get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view .title')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationName(index) {
        this.clickRelationsTab();
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view .fieldname'))
            .get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view .fieldname')).get(index).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldValue(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))),
            delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };

    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldName(index) {
        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))),
            delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };

    public static getFields() {
        browser.wait(EC.visibilityOf(element(by.css('fields-view > div'))), delays.ECWaitTime);
        return element.all(by.css('fields-view > div'))
    };

    public static getRelations() {
        this.clickRelationsTab();
        browser.sleep(delays.shortRest);
        return element.all(by.css('relations-view .relation-target'));
    };

    public static getSelectedGeometryTypeText() {
        this.clickGeometryTab();
        browser.wait(EC.visibilityOf(element(by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };

    public static getFieldElement(index) {
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'));
    }

    public static getRelationsTab() {
        return element(by.id('document-view-relations-tab'));
    }
}