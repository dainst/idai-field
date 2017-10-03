import {browser, protractor, element, by} from 'protractor';

'use strict';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

let common = require('../common.js');

export class ImageOverviewPage {

    public static selectedClass = 'selected';

    public static get = function() {

        browser.get('#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime, 'Waiting for image cells.')
    };

    // click

    public static clickCell(index) {

        return ImageOverviewPage.getCell(index).click();
    };

    public static chooseImageSubtype(index) {

        return common.click(element(by.id('choose-image-subtype-option-' + index)));
    };

    public static clickDeselectButton() {

        return common.click(element(by.id('deselect-images')));
    };

    public static clickDeleteButton() {

        return common.click(element(by.id('delete-images')));
    };

    public static clickConfirmUnlinkButton() {

        return common.click(element(by.id('remove-link-confirm')));
    };

    public static clickLinkButton() {

        return common.click(element(by.id('create-link-btn')));
    };

    public static clickUnlinkButton() {

        return common.click(element(by.id('remove-link-btn')));
    };

    public static clickConfirmDeleteButton() {

        return common.click(element(by.id('delete-images-confirm')));
    };

    public static clickCancelDeleteButton() {

        return common.click(element(by.id('delete-images-cancel')));
    };

    // double click

    public static doubleClickCell(index) {

        return browser.actions().doubleClick(ImageOverviewPage.getCell(index)).perform();
    };

    // mouse moves

    public static clickUploadArea = function() {

        return browser.actions()
            .mouseMove(element(by.css('.droparea')), {x: 10, y: 10})
            .click()
            .perform();
    };

    // send keys

    public static uploadImage(filePath) {

        return element(by.id('file')).sendKeys(filePath);
    };

    // text

    public static getCellImageName(index) {

        return ImageOverviewPage.getCell(index).element(by.css('.badge.badge-secondary')).getText();
    };

    // elements

    public static getCellFilenameElement(filename) {

        return element(by.xpath('//span[@class="badge badge-secondary"][text()="' + filename + '"]'));
    };

    public static getAllCells() {

        return element.all(by.css('.cell'));
    };
    public static getCell(index) {

        return ImageOverviewPage.getAllCells().get(index);
    };

    public static getDeleteConfirmationModal() {

        return element(by.css('.modal-dialog'));
    };

    public static getLinkModal() {

        return element(by.id('link-modal'));
    };

    public static typeInIdentifierInLinkModal(identifier) {

        return common.typeIn(ImageOverviewPage.getLinkModal().element(by.id('object-search')), identifier);
    };

    public static getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return ImageOverviewPage.getLinkModal().element(by.id('resource-'+identifier))
    };

    // sequences

    public static createDepictsRelation(identifier) {

        const imageToConnect = ImageOverviewPage.getCell(0);

        imageToConnect.click();
        expect(imageToConnect.getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
        ImageOverviewPage.clickLinkButton();
        ImageOverviewPage.typeInIdentifierInLinkModal(identifier);
        ImageOverviewPage.getSuggestedResourcesInLinkModalByIdentifier(identifier).click();
    }
}