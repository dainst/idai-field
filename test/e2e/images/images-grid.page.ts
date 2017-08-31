import {browser, protractor, element, by} from 'protractor';

'use strict';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

let common = require('../common.js');

export class ImagesGridPage {

    public static selectedClass = 'selected';

    public static get = function() {

        browser.get('#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime, 'Waiting for image cells.')
    };

    // click

    public static clickCell(index) {

        return ImagesGridPage.getCell(index).click();
    };

    public static doubleClickCell(index) {

        return browser.actions().doubleClick(ImagesGridPage.getCell(index)).perform();
    };

    public static getCellImageName(index) {

        return ImagesGridPage.getCell(index).element(by.css('.badge.badge-default')).getText();
    };

    public static getCellFilenameElement(filename) {

        return element(by.xpath('//span[@class="badge badge-default"][text()="' + filename + '"]'));
    };

    public static clickDeselectButton() {

        return element(by.id('deselect-images')).click();
    };

    public static clickDeleteButton() {

        return element(by.id('delete-images')).click();
    };

    public static clickCreateRelationsButton() {

        return element(by.id('create-relations-btn')).click();
    };

    public static clickConfirmDeleteButton() {

        return element(by.id('delete-images-confirm')).click();
    };

    public static clickCancelDeleteButton() {

        return element(by.id('delete-images-cancel')).click();
    };

    public static clickUploadArea = function() {

        return browser.actions()
            .mouseMove(element(by.css('.droparea')), {x: 10, y: 10})
            .click()
            .perform();
    };

    // elements

    public static getAllCells() {

        return element.all(by.css('.cell'));
    };
    public static getCell(index) {

        return ImagesGridPage.getAllCells().get(index);
    };

    public static getDeleteConfirmationModal() {

        return element(by.css('.modal-dialog'));
    };

    public static getLinkModal() {

        return element(by.id('link-modal'));
    };

    public static typeInIdentifierInLinkModal(identifier) {

        return common.typeIn(ImagesGridPage.getLinkModal().element(by.id('object-search')), identifier);
    };

    public static getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return ImagesGridPage.getLinkModal().element(by.id('resource-'+identifier))
    };

    public static uploadImage(filePath) {

        return element(by.id('file')).sendKeys(filePath);
    };

    public static chooseImageSubtype(index) {

        return element(by.id('choose-image-subtype-option-' + index)).click();
    };

    // sequences

    public static createDepictsRelation(identifier) {

        const imageToConnect = ImagesGridPage.getCell(0);

        imageToConnect.click();
        expect(imageToConnect.getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
        ImagesGridPage.clickCreateRelationsButton();
        ImagesGridPage.typeInIdentifierInLinkModal(identifier);
        ImagesGridPage.getSuggestedResourcesInLinkModalByIdentifier(identifier).click();
    }
}