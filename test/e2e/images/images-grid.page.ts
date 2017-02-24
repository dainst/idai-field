import {browser,protractor,element,by} from 'Protractor';

'use strict';
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');

var common = require("../common.js");

var ImagesGridPage = function() {

    this.selectedClass = 'selected';
    this.getAllCells = function() {
        return element.all(by.css('.cell'));
    };
    this.getCell = function (index) {
        return this.getAllCells().get(index);
    };
    this.clickCell = function (index) {
        return this.getCell(index).click();
    };
    this.doubleClickCell = function (index) {
        return browser.actions().doubleClick(this.getCell(index)).perform();
    };
    this.getCellImageName = function(index) {
        return this.getCell(index).element(by.css('.tag.tag-default')).getText();
    };
    this.getCellFilenameElement = function(filename) {
        return element(by.xpath('//span[@class="tag tag-default"][text()="' + filename + '"]'));
    };
    this.clickDeselectButton = function () {
        return element(by.id('deselect-images')).click();
    };
    this.clickDeleteButton = function () {
        return element(by.id('delete-images')).click();
    };
    this.clickCreateRelationsButton = function () {
        return element(by.id('create-relations-btn')).click();
    };
    this.clickConfirmDeleteButton = function () {
        return element(by.id('delete-images-confirm')).click();
    };
    this.clickCancelDeleteButton = function () {
        return element(by.id('delete-images-cancel')).click();
    };
    this.getDeleteConfirmationModal = function() {
        return element(by.css('.modal-dialog'));
    };
    this.getLinkModal = function() {
        return element(by.id('link-modal'));
    };
    this.typeInIdentifierInLinkModal = function(identifier) {
        return common.typeIn(this.getLinkModal().element(by.id('object-search')), identifier);
    };
    this.getSuggestedResourcesInLinkModalByIdentifier = function (identifier) {
        return this.getLinkModal().element(by.id('resource-'+identifier))
    };
    this.uploadImage = function (filePath) {
        return element(by.id('file')).sendKeys(filePath);
    };
    this.clickUploadArea = function() {
        return browser.actions()
            .mouseMove(element(by.css(".droparea")), {x: 10, y: 10})
            .click()
            .perform();
    };
    this.get = function() {
        browser.get('/#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime, 'Waiting for image cells.')
    };
    this.chooseImageSubtype = function (index) {
        return element(by.id('choose-image-subtype-option-' + index)).click();
    };
};

module.exports = new ImagesGridPage();