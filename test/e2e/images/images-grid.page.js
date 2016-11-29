'use strict';
var EC = protractor.ExpectedConditions;

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
    this.clickDeselectButton = function () {
        return element(by.id('deselect-images')).click();
    };
    this.clickDeleteButton = function () {
        return element(by.id('delete-images')).click();
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
    this.uploadImage = function (filePath) {
        return element(by.id('file')).sendKeys(filePath);
    };
    this.clickUploadArea = function() {
        return element(by.css('.droparea')).click();
    };
    this.get = function() {
        browser.get('/#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), 10000, 'Waiting for image cells.');
    }
};

module.exports = new ImagesGridPage();