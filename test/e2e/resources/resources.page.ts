import {browser, protractor, element, by} from 'protractor';

'use strict';
let common = require('../common.js');
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';


let ResourcesPage = function() {

    this.get = function() {
        return browser.get('#/resources/excavation');
    };

    // click

    this.clickCreateObject = function() {
        common.click(by.id('object-overview-button-create-object'));
    };

    this.clickSaveInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-save-button'))), delays.ECWaitTime);
        common.click(by.id('overview-save-confirmation-modal-save-button'));
    };

    this.clickCancelInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-cancel-button'))), delays.ECWaitTime);
        common.click(by.id('overview-save-confirmation-modal-cancel-button'));
    };

    this.clickDiscardInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('overview-save-confirmation-modal-discard-button'))), delays.ECWaitTime);
        common.click(by.id('overview-save-confirmation-modal-discard-button'));
    };

    this.clickDeleteDocument = function() {
        browser.wait(EC.visibilityOf(element(by.id('document-edit-button-delete-document'))), delays.ECWaitTime);
        common.click(by.id('document-edit-button-delete-document'));
    };

    this.clickDeleteInModal = function() {
        browser.wait(EC.visibilityOf(element(by.id('delete-resource-confirm'))), delays.ECWaitTime);
        common.click(by.id('delete-resource-confirm'));
    };

    this.clickChooseTypeFilter = function(typeIndex) {

        common.click(by.id('searchfilter'));
        common.click(by.id('choose-type-filter-option-' + typeIndex));
    };

    this.clickSelectGeometryType = function(type) {
        let geom = 'none';
        if (type) geom = type;
        return common.click(by.id('choose-geometry-option-' + geom));
    };

    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    this.clickSelectObjectByIndex = function(listIndex) {
        browser.wait(EC.visibilityOf(element(by.id('objectList')).all(by.tagName('li')).get(listIndex)),
            delays.ECWaitTime);
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    };

    this.clickSelectResource = function(identifier) {
        common.click(by.xpath('//*[@id="objectList"]//div[@class="identifier" and normalize-space(text())="'
            + identifier + '"]'));
    };

    this.clickListModeButton = function() {
        common.click(by.id('list-mode-button'));
    };

    this.openEditByDoubleClickResource = function(identifier) {
        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="objectList"]//div[@class="identifier" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="objectList"]//div[@class="identifier" and ' +
            'normalize-space(text())="' + identifier + '"]'))).perform();
    };

    this.clickSelectResourceType = function(typeIndex) {
        if (!typeIndex) typeIndex = 0;
        return element(by.id('choose-type-option-' + typeIndex)).click();
    };

    // get text

    this.getListItemIdentifierText = function(itemNr) {
        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child('
            + (itemNr + 1) + ') .identifier'))), delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item:nth-child(' + (itemNr + 1) + ') .identifier')).getText();
    };

    this.getSelectedListItemIdentifierText = function() {
        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item.selected .identifier'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item.selected .identifier')).getText();
    };

    this.getListModeInputFieldValue = function(identifier, index) {
        return this.getListModeInputField(identifier, index).getAttribute('value');
    };

    this.getSelectedMainTypeDocumentOption = function() {
        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBox option:checked'))), delays.ECWaitTime);
        return element.all(by.css('#mainTypeSelectBox option:checked')).getText();
    };

    // elements

    this.getListItemMarkedNewEl = function() {
        return element(by.css('#objectList .list-group-item .new'));
    };

    this.getListItemMarkedNewEls = function() {
        return element.all(by.css('#objectList .list-group-item .new'));
    };

    this.getListItemEl = function(identifier) {
        return element(by.id('resource-' + identifier));
    };

    this.getListModeInputField = function(identifier, index) {
        browser.wait(EC.visibilityOf(element.all(by.id('resource-' + identifier + ' input')).get(index)));
        return element.all(by.id('resource-' + identifier + ' input')).get(index);
    };

    this.selectMainType = function(option) {
        browser.wait(EC.presenceOf(element(by.id('mainTypeSelectBox'))), delays.ECWaitTime);
        element.all(by.css('#mainTypeSelectBox option')).get(option).click();
    };

    // sequences

    this.performCreateResource = function(identifier, typeIndex, inputFieldText?: string, inputFieldIndex?: number) {
        this.clickCreateObject();
        this.clickSelectResourceType(typeIndex);
        this.clickSelectGeometryType();
        DocumentEditWrapperPage.typeInInputField(identifier);
        if (inputFieldText && inputFieldIndex) {
            DocumentEditWrapperPage.typeInInputField(inputFieldText, inputFieldIndex);
        }
        this.scrollUp();
        DocumentEditWrapperPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    this.performCreateRelation = function(identifier, targetIdentifier, relationGroupIndex) {
        this.openEditByDoubleClickResource(identifier);
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickAddRelationForGroupWithIndex(relationGroupIndex);
        DocumentEditWrapperPage.typeInRelationByIndices(relationGroupIndex, 0, targetIdentifier);
        DocumentEditWrapperPage.clickChooseRelationSuggestion(relationGroupIndex, 0, 0);
        DocumentEditWrapperPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    this.performCreateLink = function() {
        this.performCreateResource('1', 1); // Fund
        this.performCreateResource('2', 1); // Fund
        this.performCreateRelation('2', '1', 1);
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

    this.typeInListModeInputField = function(identifier, index, inputText) {
        return common.typeIn(this.getListModeInputField(identifier, index), inputText);
    };
};

module.exports = new ResourcesPage();