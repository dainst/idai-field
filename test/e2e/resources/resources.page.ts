import {browser,protractor,element,by} from 'protractor';

'use strict';
let common = require("../common.js");
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';


let ResourcesPage = function() {

    this.get = function() {
        return browser.get('/#/resources');
    };

    this.refresh = function() {
        browser.driver.get('http://localhost:8081/#/import');
        browser.driver.get('http://localhost:8081/#/resources');
        return browser.waitForAngular();
    };

    // click

    // TODO create click function in common

    this.clickCreateObject = function() {
        browser.wait(EC.visibilityOf(element(by.id('object-overview-button-create-object'))), delays.ECWaitTime);
        element(by.id('object-overview-button-create-object')).click();
    };

    this.clickSaveInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-save-button'))), delays.ECWaitTime);
        element(by.id('overview-save-confirmation-modal-save-button')).click();
    };

    this.clickCancelInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-cancel-button'))), delays.ECWaitTime);
        element(by.id('overview-save-confirmation-modal-cancel-button')).click();
    };

    this.clickDiscardInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-discard-button'))), delays.ECWaitTime);
        element(by.id('overview-save-confirmation-modal-discard-button')).click();
    };

    this.clickDeleteDocument = function() {
        browser.wait(EC.visibilityOf(element(by.id('document-edit-button-delete-document'))), delays.ECWaitTime);
        element(by.id('document-edit-button-delete-document')).click();
    };

    this.clickDeleteInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('delete-resource-confirm'))), delays.ECWaitTime);
        element(by.id('delete-resource-confirm')).click();
    };

    this.clickChooseTypeFilter = function(typeIndex) {

        browser.wait(EC.visibilityOf(element(by.id('searchfilter'))), delays.ECWaitTime);
        element(by.id('searchfilter')).click();
        browser.wait(EC.visibilityOf(element(by.id('choose-type-filter-option-' + typeIndex))), delays.ECWaitTime);
        element(by.id('choose-type-filter-option-' + typeIndex)).click();
    };

    this.clickCreateGeometry = function(type) {
        return element(by.id('document-view-button-create-' + type)).click();
    };

    this.clickReeditGeometry = function() {
        browser.wait(EC.visibilityOf(element(by.id('document-view-button-edit-geometry'))), delays.ECWaitTime);
        element(by.id('document-view-button-edit-geometry')).click();
    };

    this.clickSelectGeometryType = function(type) {
        var geom = 'none';
        if (type) geom = type;
        browser.wait(EC.visibilityOf(element(by.id('geometry-type-selection'))), delays.ECWaitTime);
        return element(by.id('choose-geometry-option-' + geom)).click();
    };

    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    this.clickSelectObjectByIndex = function(listIndex) {
        browser.wait(EC.visibilityOf(element(by.id('objectList')).all(by.tagName('li')).get(listIndex)), delays.ECWaitTime);
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    };

    this.clickSelectResource = function(identifier) {
        browser.wait(EC.visibilityOf(element(by.xpath("//*[@id='objectList']//div[@class='identifier' and normalize-space(text())='"+identifier+"']"))), delays.ECWaitTime);
        return element(by.xpath("//*[@id='objectList']//div[@class='identifier' and normalize-space(text())='"+identifier+"']")).click();
    };

    this.clickSelectResourceType = function(typeIndex) {
        if (!typeIndex) typeIndex = 0;
        return element(by.id('choose-type-option-' + typeIndex)).click();
    };

    // get text

    this.getListItemIdentifierText = function(itemNr) {
        return element.all(by.css('#objectList .list-group-item:nth-child('+(itemNr+1)+') .identifier')).first().getText();
    };

    this.getSelectedGeometryTypeText = function() {
        browser.wait(EC.visibilityOf(element(by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };

    // elements

    this.getListItemMarkedNewEl = function() {
        return element(by.css('#objectList .list-group-item .new'));
    };

    this.getListItemEl = function(identifier) {
        return element(by.id('resource-' + identifier));
    };

    this.getListItemEls = function() {
        return element.all(by.css('#objectList .list-group-item'));
    };

    // sequences

    this.performCreateResource = function(identifier, typeIndex, inputFieldText?: string) {
        this.clickCreateObject();
        this.clickSelectResourceType(typeIndex);
        this.clickSelectGeometryType();
        DocumentEditWrapperPage.typeInInputField(identifier);
        if (inputFieldText) DocumentEditWrapperPage.typeInInputField(inputFieldText,2);
        this.scrollUp();
        DocumentEditWrapperPage.clickSaveDocument();
    };


    this.performCreateLink = function() {
        this.performCreateResource('1', 2);
        this.performCreateResource('2', 2);
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickAddRelationForGroupWithIndex(0);
        DocumentEditWrapperPage.typeInRelationByIndices(0, 0, '1');
        DocumentEditWrapperPage.clickChooseRelationSuggestion(0, 0, 0);
        this.scrollUp();
        DocumentEditWrapperPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    // script

    this.scrollDown = function() {
        return browser.executeScript('window.scrollTo(0,200);');
    };

    this.scrollUp = function() {
        return browser.executeScript('window.scrollTo(0,0);');
    };

    // type in

    this.typeInIdentifierInSearchField = function(identifier) {
        return common.typeIn(element(by.id('object-search')), identifier);
    };
};

module.exports = new ResourcesPage();