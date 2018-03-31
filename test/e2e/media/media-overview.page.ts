import {browser, protractor, element, by} from 'protractor';

'use strict';
import {NavbarPage} from '../navbar.page';
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

let common = require('../common.js');

export class MediaOverviewPage {

    public static selectedClass = 'selected';

    public static get() {

        browser.get('#/media');
    }

    public static getAndWaitForImageCells() {

        MediaOverviewPage.get();
        MediaOverviewPage.waitForCells();
    };

    public static waitForCells() {

        return browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime, 'Waiting for image cells.');
    }

    // click

    public static clickCell(index) {

        return MediaOverviewPage.getCell(index).click();
    };

    public static chooseImageSubtype(index) {

        return common.click(element(by.id('choose-image-subtype-option-' + index)));
    };

    public static clickDeselectButton() {

        return common.click(element(by.id('deselect-media-resources')));
    };

    public static clickDeleteButton() {

        return common.click(element(by.id('delete-media-resources')));
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

        return common.click(element(by.id('delete-media-resources-confirm')));
    };

    public static clickCancelDeleteButton() {

        return common.click(element(by.id('delete-media-resources-cancel')));
    };

    public static clickSelectMainTypeDocumentFilterOption(optionIndex: number) {

        browser.wait(EC.presenceOf(element(by.id('main-type-document-filter-select'))), delays.ECWaitTime);
        element.all(by.css('#main-type-document-filter-select option')).get(optionIndex).click();
    };

    public static clickIncreaseGridSizeButton() {

        common.click(element(by.id('increase-grid-size-button')));
    }

    // double click

    public static doubleClickCell(index) {

        return browser.actions().doubleClick(MediaOverviewPage.getCell(index)).perform();
    };

    // mouse moves

    public static clickUploadArea = function() {

        return browser.actions()
            .mouseMove(element(by.css('.droparea')), {x: 10, y: 10})
            .click()
            .perform();
    };

    // send keys

    public static uploadFile(filePath) {

        return element(by.id('file')).sendKeys(filePath);
    };

    // text

    public static getCellMediaResourceName(index) {

        return MediaOverviewPage.getCell(index).getAttribute('id').then(id => id.substring('resource-'.length));
    };

    public static getGridSizeSliderValue() {

        return element(by.id('grid-size-slider')).getAttribute('value');
    }

    // elements

    public static getAllCells() {

        return element.all(by.css('.cell'));
    };

    public static getCell(index) {

        return MediaOverviewPage.getAllCells().get(index);
    };

    public static getCellByIdentifier(identifier: string) {

        return element(by.id('resource-' + identifier));
    };

    public static getDeleteConfirmationModal() {

        return element(by.css('.modal-dialog'));
    };

    public static getLinkModal() {

        return element(by.id('link-modal'));
    };

    public static typeInIdentifierInLinkModal(identifier) {

        return common.typeIn(MediaOverviewPage.getLinkModal().element(by.id('object-search')), identifier);
    };

    public static getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return MediaOverviewPage.getLinkModal().element(by.id('resource-'+identifier))
    };

    // sequences

    public static createDepictsRelation(identifier) {

        const mediaResourceToConnect = MediaOverviewPage.getCell(0);

        mediaResourceToConnect.click();
        expect(mediaResourceToConnect.getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
        MediaOverviewPage.clickLinkButton();
        MediaOverviewPage.typeInIdentifierInLinkModal(identifier);
        MediaOverviewPage.getSuggestedResourcesInLinkModalByIdentifier(identifier).click();
        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToMediaOverview();
        browser.sleep(delays.shortRest * 5);
    }
}