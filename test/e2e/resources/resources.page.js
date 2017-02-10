'use strict';
var common = require("../common.js");
var timeToWaitAfterClickSave = 100;
var EC = protractor.ExpectedConditions;
var ECWaitTime = 2500;

var ResourcesPage = function () {

    this.clickCreateObject = function() {
        return element(by.id('object-overview-button-create-object')).click();
    };

    this.clickSaveInModal = function () {
        return element(by.id('overview-save-confirmation-modal-save-button')).click();
    };

    this.clickCancelInModal = function () {
        return element(by.id('overview-save-confirmation-modal-cancel-button')).click();
    };

    this.clickCloseMessage = function () {
        return browser.wait(EC.visibilityOf(element(by.css('#message-0 button'))), ECWaitTime)
            .then(function(){
                return element(by.css('#message-0 button')).click();
            })
    };

    this.clickEditDocument = function () {
        return element(by.id('document-view-button-edit-document')).click();
    };

    this.clickBackToDocumentView = function () {
        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-goto-view'))), ECWaitTime)
            .then(function(){
                return element(by.id('document-edit-button-goto-view')).click();
            })
    };

    this.clickSaveDocument = function () {
        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-save-document'))), ECWaitTime)
            .then(function(){
                element(by.id('document-edit-button-save-document')).click().then(
                    function() {
                        return new Promise(function(resolve){
                            setTimeout(function(){
                                resolve();
                            },timeToWaitAfterClickSave);
                        })
                    }
                )
            })
    };

    this.clickCreateGeometry = function (type) {
        return element(by.id('document-view-button-create-' + type)).click();
    };

    this.clickReeditGeometry = function () {
        return browser.wait(EC.visibilityOf(element(by.id('document-view-button-edit-geometry'))), ECWaitTime)
            .then(function(){
            return element(by.id('document-view-button-edit-geometry')).click();
        })
    };

    this.clickRelationSuggestionByIndices = function (groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationByIndices(groupIndex, pickerIndex)
            .all(by.css('.suggestion')).get(suggestionIndex).click();
    };

    this.clickAddRelationForGroupWithIndex = function (groupIndex) {
        return element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .element(by.css('.circular-button.add-relation')).click();
    };

    this.clickRelationInDocumentView = function (relationIndex) {
        return element.all(by.css('#document-view a')).get(relationIndex).click();
    };

    this.selectGeometryType = function (type) {
        var geom = 'none';
        if (type) geom = type;
        return browser.wait(EC.visibilityOf(element(by.id('geometry-type-selection'))), ECWaitTime)
            .then(function(){
                return element(by.id('choose-geometry-option-' + geom)).click();
            });
    };

    this.createResource = function(identifier, typeIndex) {
        var _this = this;
        return this.clickCreateObject()
            .then(function() {
                return _this.selectResourceType(typeIndex);
            })
            .then(_this.selectGeometryType)
            .then(function(){return _this.typeInIdentifier(identifier)})
            .then(_this.scrollUp)
            .then(_this.clickSaveDocument)
    };

    this.findListItemMarkedNew = function () {
        return element(by.css('#objectList .list-group-item .new'))
    };

    this.getFirstListItemIdentifier = function () {
        return element.all(by.css('#objectList .list-group-item .identifier')).first().getText();
    };

    this.getListItemByIdentifier = function (identifier) {
        return element(by.id('resource-' + identifier));
    };

    this.getMessage = function(){
        return browser.wait(EC.visibilityOf(element(by.id('message-0'))), ECWaitTime)
            .then(function() {
                return element(by.id('message-0')).getText();
            });
    };

    this.getTypeOfSelectedGeometry = function() {
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };

    this.getRelationByIndices = function (groupIndex, pickerIndex) {
        return element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .all(by.tagName('relation-picker')).get(pickerIndex);
    };

    this.getRelationSuggestionByIndices = function(groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationByIndices(groupIndex, pickerIndex).all(by.css('.suggestion')).get(suggestionIndex);
    };

    this.getRelationButtonByIndices = function (groupIndex, pickerIndex, relationIndex) {
        return this.getRelationByIndices(groupIndex, pickerIndex).all(by.tagName('button')).get(relationIndex);
    };

    this.getRelationButtonTextByIndices = function (groupIndex, pickerIndex, relationIndex) {
        return this.getRelationButtonByIndices(groupIndex, pickerIndex, relationIndex).element(by.tagName('span')).getText();
    };

    this.getRelationNameInDocumetView = function (relationIndex) {
        return element.all(by.css('#document-view a')).get(relationIndex).getText();
    };

    this.get = function () {
        return browser.get('/#/resources');
    };

    this.scrollDown = function () {
        return browser.executeScript('window.scrollTo(0,200);');
    };

    this.scrollUp = function() {
        return browser.executeScript('window.scrollTo(0,0);');
    };

    this.setTypeFilter = function(typeIndex) {

        return browser.wait(EC.visibilityOf(element(by.id('searchfilter'))), ECWaitTime)
            .then(function(){
                return element(by.id('searchfilter')).click()
                    .then(function() {
                        return browser.wait(EC.visibilityOf(element(by.id('choose-type-filter-option-' + typeIndex))), ECWaitTime)
                            .then(function() {
                                return element(by.id('choose-type-filter-option-' + typeIndex)).click()
                            })
                    });
            });
    };

    this.selectObjectByIndex = function (listIndex) {
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    };

    this.selectResourceType = function (typeIndex) {
        if (!typeIndex) typeIndex = 0;
        return element(by.id('choose-type-option-' + typeIndex)).click();
    };



    this.typeInIdentifierInSearchField = function(identifier) {
        return common.typeIn(element(by.id('object-search')), identifier);
    };

    this.typeInIdentifier = function(identifier) {
        // element-2, 0,1 and 2 are type, id, geometries
        return browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-3 input'))), ECWaitTime)
            .then(function(){
                return common.typeIn(element(by.css('#edit-form-element-3 input')), identifier);
            });
    };

    this.typeInRelationByIndices = function(groupIndex, pickerIndex, input) {
        common.typeIn(this.getRelationByIndices(groupIndex, pickerIndex)
            .element(by.tagName('input')), input);
    };
};

module.exports = new ResourcesPage();