"use strict";
var Protractor_1 = require("Protractor");
'use strict';
var common = require("../common.js");
var EC = Protractor_1.protractor.ExpectedConditions;
var delays = require('../config/delays');
var ResourcesPage = function () {
    this.get = function () {
        return Protractor_1.browser.get('/#/resources');
    };
    // click
    // TODO create click function in common
    this.clickCreateObject = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('object-overview-button-create-object'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('object-overview-button-create-object')).click();
    };
    this.clickSaveInModal = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-save-button'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-save-button')).click();
    };
    this.clickCancelInModal = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-cancel-button'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-cancel-button')).click();
    };
    this.clickDiscardInModal = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-discard-button'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('overview-save-confirmation-modal-discard-button')).click();
    };
    this.clickCloseMessage = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('#message-0 button'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.css('#message-0 button')).click();
    };
    this.clickEditDocument = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('document-view-button-edit-document'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('document-view-button-edit-document')).click();
    };
    this.clickBackToDocumentView = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('document-edit-button-goto-view'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('document-edit-button-goto-view')).click();
    };
    this.clickChooseTypeFilter = function (typeIndex) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('searchfilter'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('searchfilter')).click();
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('choose-type-filter-option-' + typeIndex))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('choose-type-filter-option-' + typeIndex)).click();
    };
    this.clickCreateGeometry = function (type) {
        return Protractor_1.element(Protractor_1.by.id('document-view-button-create-' + type)).click();
    };
    this.clickReeditGeometry = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('document-view-button-edit-geometry'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.id('document-view-button-edit-geometry')).click();
    };
    this.clickChooseRelationSuggestion = function (groupIndex, pickerIndex, suggestionIndex) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('.suggestion'))), delays.ECWaitTime);
        this.getRelationEl(groupIndex, pickerIndex)
            .all(Protractor_1.by.css('.suggestion')).get(suggestionIndex).click();
    };
    this.clickAddRelationForGroupWithIndex = function (groupIndex) {
        Protractor_1.element.all(Protractor_1.by.tagName('relation-picker-group')).get(groupIndex)
            .element(Protractor_1.by.css('.circular-button.add-relation')).click();
    };
    this.clickRelationInDocumentView = function (relationIndex) {
        return Protractor_1.element.all(Protractor_1.by.css('#document-view a')).get(relationIndex).click();
    };
    this.clickRelationDeleteButtonByIndices = function (groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationEl(groupIndex, pickerIndex).all(Protractor_1.by.css('.delete-relation')).get(suggestionIndex)
            .click();
    };
    this.clickRelationsTab = function () {
        Protractor_1.element(Protractor_1.by.id('document-edit-relations-tab')).click();
    };
    this.clickFieldsTab = function () {
        Protractor_1.element(Protractor_1.by.id('document-edit-fields-tab')).click();
    };
    this.clickSelectGeometryType = function (type) {
        var geom = 'none';
        if (type)
            geom = type;
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('geometry-type-selection'))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.id('choose-geometry-option-' + geom)).click();
    };
    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    this.clickSelectObjectByIndex = function (listIndex) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('objectList')).all(Protractor_1.by.tagName('li')).get(listIndex)), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.id('objectList')).all(Protractor_1.by.tagName('li')).get(listIndex).click();
    };
    this.clickSelectResource = function (identifier) {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.xpath("//*[@id='objectList']//div[@class='identifier' and normalize-space(text())='" + identifier + "']"))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.xpath("//*[@id='objectList']//div[@class='identifier' and normalize-space(text())='" + identifier + "']")).click();
    };
    this.clickSelectResourceType = function (typeIndex) {
        if (!typeIndex)
            typeIndex = 0;
        return Protractor_1.element(Protractor_1.by.id('choose-type-option-' + typeIndex)).click();
    };
    // get text
    this.getFirstListItemIdentifierText = function () {
        return Protractor_1.element.all(Protractor_1.by.css('#objectList .list-group-item .identifier')).first().getText();
    };
    this.getMessageText = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('message-0'))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.id('message-0')).getText();
    };
    this.getSelectedGeometryTypeText = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.id('document-view-field-geometry')).element(Protractor_1.by.css('.fieldvalue')).getText();
    };
    this.getRelationButtonText = function (groupIndex, pickerIndex, relationIndex) {
        this.clickRelationsTab();
        return this.getRelationButtonEl(groupIndex, pickerIndex, relationIndex).element(Protractor_1.by.tagName('span')).getText();
    };
    // elements
    this.getListItemMarkedNewEl = function () {
        return Protractor_1.element(Protractor_1.by.css('#objectList .list-group-item .new'));
    };
    this.getListItemEl = function (identifier) {
        return Protractor_1.element(Protractor_1.by.id('resource-' + identifier));
    };
    this.getRelationEl = function (groupIndex, pickerIndex) {
        return Protractor_1.element.all(Protractor_1.by.tagName('relation-picker-group')).get(groupIndex)
            .all(Protractor_1.by.tagName('relation-picker')).get(pickerIndex);
    };
    this.getRelationSuggestionEl = function (groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationEl(groupIndex, pickerIndex).all(Protractor_1.by.css('.suggestion')).get(suggestionIndex);
    };
    this.getRelationButtonEl = function (groupIndex, pickerIndex, relationIndex) {
        return this.getRelationEl(groupIndex, pickerIndex).all(Protractor_1.by.tagName('button')).get(relationIndex);
    };
    // sequences
    this.performCreateResource = function (identifier, typeIndex) {
        this.clickCreateObject();
        this.clickSelectResourceType(typeIndex);
        this.clickSelectGeometryType();
        this.typeInIdentifier(identifier);
        this.scrollUp();
        this.clickSaveDocument();
    };
    this.performCreateLink = function () {
        this.performCreateResource('1');
        this.performCreateResource('2');
        this.clickRelationsTab();
        this.clickAddRelationForGroupWithIndex(0);
        this.typeInRelationByIndices(0, 0, '1');
        this.clickChooseRelationSuggestion(0, 0, 0);
        this.scrollUp();
        this.clickSaveDocument();
        Protractor_1.browser.sleep(delays.shortRest);
    };
    this.clickSaveDocument = function () {
        return Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('document-edit-button-save-document'))), delays.ECWaitTime)
            .then(function () {
            Protractor_1.element(Protractor_1.by.id('document-edit-button-save-document')).click().then(function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve();
                    }, delays.shortRest);
                });
            });
        });
    };
    // script
    this.scrollDown = function () {
        return Protractor_1.browser.executeScript('window.scrollTo(0,200);');
    };
    this.scrollUp = function () {
        return Protractor_1.browser.executeScript('window.scrollTo(0,0);');
    };
    // type in
    this.typeInIdentifierInSearchField = function (identifier) {
        return common.typeIn(Protractor_1.element(Protractor_1.by.id('object-search')), identifier);
    };
    this.typeInIdentifier = function (identifier) {
        // element-2, 0,1 and 2 are type, id, geometries
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('#edit-form-element-3 input'))), delays.ECWaitTime);
        common.typeIn(Protractor_1.element(Protractor_1.by.css('#edit-form-element-3 input')), identifier);
    };
    this.typeInRelationByIndices = function (groupIndex, pickerIndex, input) {
        common.typeIn(this.getRelationEl(groupIndex, pickerIndex)
            .element(Protractor_1.by.tagName('input')), input);
    };
};
module.exports = new ResourcesPage();
