'use strict';
var EC = protractor.ExpectedConditions;

module.exports =  {
    selectedClass: 'selected',
    getAllCells: function() {
        return element.all(by.css('.cell'));
    },
    getCell: function(index) {
        return element.all(by.css('.cell')).get(index);
    },
    clickCell: function (index) {
        return this.getCell(index).click();
    },
    doubleClickCell: function (index) {
        return browser.actions().doubleClick(this.getCell(index)).perform();
    },
    getCellImageName: function(index) {
        return this.getCell(index).element(by.css('.tag.tag-default')).getText();
    },
    clickDeselectButton: function () {
        return element(by.id('deselect-images')).click();
    },
    clickDeleteButton: function () {
        return element(by.id('delete-images')).click();
    },
    clickConfirmDeleteButton: function () {
        return element(by.id('delete-images-confirm')).click();
    },
    clickCancelDeleteButton: function () {
        return element(by.id('delete-images-cancel')).click();
    },
    getDeleteConfirmationModal: function() {
        return element(by.css('.modal-dialog'));
    },
    uploadImage: function (filePath) {
        return element(by.id('file')).sendKeys(filePath);
    },
    clickUploadArea: function() {
        return element(by.css('.droparea')).click();
    },
    get: function() {
        browser.get('/#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), 10000, 'Waiting for image cells.');
    }
};