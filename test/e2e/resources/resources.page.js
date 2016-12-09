'use strict';

var common = require("../common.js");

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
        return element(by.css('#message-0 button')).click();
    };

    this.clickEditDocument = function () {
        return element(by.id('document-view-button-edit-document')).click();
    };

    this.clickBackToDocumentView = function () {
        return element(by.id('document-edit-button-goto-view')).click();
    };

    this.clickSaveDocument = function () {
        return element(by.id('document-edit-button-save-document')).click();
    };

    this.clickCreateGeometry = function (type) {
        return element(by.id('document-view-button-create-' + type)).click();
    };

    this.clickReeditGeometry = function () {
        browser.sleep(10000);
        return element(by.id('document-view-button-edit-geometry')).click();
    };

    this.createResource = function(identifier, typeIndex) {
        var _this = this;
        return this.clickCreateObject()
            .then(function() {
                return _this.selectResourceType(typeIndex);
            })
            .then(this.selectGeometryType)
            .then(this.typeInIdentifier(identifier))
            .then(this.scrollUp)
            .then(this.clickSaveDocument)
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
        return element(by.id('message-0')).getText();
    };

    this.getTypeOfSelectedGeometry = function() {
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };

    this.get = function () {
        browser.get('/#/resources');
    };

    this.scrollDown = function () {
        return browser.executeScript('window.scrollTo(0,200);');
    };

    this.scrollUp = function() {
        return browser.executeScript('window.scrollTo(0,0);');
    };

    this.setTypeFilter = function(typeIndex) {
        return element(by.id('searchfilter')).click()
            .then(function() {
                return element(by.id('choose-type-filter-option-' + typeIndex)).click()
            });
    };

    this.selectObjectByIndex = function (listIndex) {
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    };

    this.selectResourceType = function (typeIndex) {
        if (!typeIndex) typeIndex = 0;
        return element(by.id('choose-type-option-' + typeIndex)).click();
    };

    this.selectGeometryType = function (type) {
        var geom = 'none';
        if (type) geom = type;
        return element(by.id('choose-geometry-option-' + geom)).click();
    };

    this.typeInIdentifierInSearchField = function(identifier) {
        return common.typeIn(element(by.id('object-search')), identifier);
    };

    this.typeInIdentifier = function(identifier) {
        // element-2, 0,1 and 2 are type, id, geometries
        return common.typeIn(element(by.css('#edit-form-element-3 input')), identifier);
    };
};

module.exports = new ResourcesPage();