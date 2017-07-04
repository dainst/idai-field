import {browser,protractor,element,by} from 'protractor';

'use strict';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

let common = require("../common.js");

export class ImagesGridPage {

    public static selectedClass = 'selected';

    public static getAllCells = function() {
        return element.all(by.css('.cell'));
    };
    public static getCell = function (index) {
        return ImagesGridPage.getAllCells().get(index);
    };
    public static clickCell = function (index) {
        return ImagesGridPage.getCell(index).click();
    };
    public static doubleClickCell = function (index) {
        return browser.actions().doubleClick(ImagesGridPage.getCell(index)).perform();
    };
    public static getCellImageName = function(index) {
        return ImagesGridPage.getCell(index).element(by.css('.tag.tag-default')).getText();
    };
    public static getCellFilenameElement = function(filename) {
        return element(by.xpath('//span[@class="tag tag-default"][text()="' + filename + '"]'));
    };
    public static clickDeselectButton = function () {
        return element(by.id('deselect-images')).click();
    };
    public static clickDeleteButton = function () {
        return element(by.id('delete-images')).click();
    };
    public static clickCreateRelationsButton = function () {
        return element(by.id('create-relations-btn')).click();
    };
    public static clickConfirmDeleteButton = function () {
        return element(by.id('delete-images-confirm')).click();
    };
    public static clickCancelDeleteButton = function () {
        return element(by.id('delete-images-cancel')).click();
    };
    public static getDeleteConfirmationModal = function() {
        return element(by.css('.modal-dialog'));
    };
    public static getLinkModal = function() {
        return element(by.id('link-modal'));
    };
    public static typeInIdentifierInLinkModal = function(identifier) {
        return common.typeIn(ImagesGridPage.getLinkModal().element(by.id('object-search')), identifier);
    };
    public static getSuggestedResourcesInLinkModalByIdentifier = function (identifier) {
        return ImagesGridPage.getLinkModal().element(by.id('resource-'+identifier))
    };
    public static uploadImage = function (filePath) {
        return element(by.id('file')).sendKeys(filePath);
    };
    public static clickUploadArea = function() {
        return browser.actions()
            .mouseMove(element(by.css(".droparea")), {x: 10, y: 10})
            .click()
            .perform();
    };
    public static get = function() {
        browser.get('#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime, 'Waiting for image cells.')
    };
    public static chooseImageSubtype = function (index) {
        return element(by.id('choose-image-subtype-option-' + index)).click();
    };
}