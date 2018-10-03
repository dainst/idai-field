'use strict';

import {browser, protractor, element, by} from 'protractor';
import {NavbarPage} from '../navbar.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common.js');


export module MediaOverviewPage {

    export const selectedClass = 'selected';


    export function get() {

        browser.get('#/media');
    }


    export function getAndWaitForImageCells() {

        MediaOverviewPage.get();
        MediaOverviewPage.waitForCells();
    }


    export function waitForCells() {

        return browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime,
            'Waiting for image cells.');
    }


    // click

    export function clickCell(index) {

        return MediaOverviewPage.getCell(index).click();
    }


    export function chooseImageSubtype(index) {

        return common.click(element(by.id('choose-image-subtype-option-' + index)));
    }


    export function clickDeselectButton() {

        return common.click(element(by.id('deselect-media-resources')));
    }


    export function clickDeleteButton() {

        return common.click(element(by.id('delete-media-resources')));
    }


    export function clickConfirmUnlinkButton() {

        return common.click(element(by.id('remove-link-confirm')));
    }


    export function clickLinkButton() {

        return common.click(element(by.id('create-link-btn')));
    }


    export function clickUnlinkButton() {

        return common.click(element(by.id('remove-link-btn')));
    }


    export function clickConfirmDeleteButton() {

        return common.click(element(by.id('delete-media-resources-confirm')));
    }


    export function clickCancelDeleteButton() {

        return common.click(element(by.id('delete-media-resources-cancel')));
    }


    export function clickSelectMainTypeDocumentFilterOption(optionIndex: number) {

        browser.wait(EC.presenceOf(element(by.id('main-type-document-filter-select'))), delays.ECWaitTime);
        element.all(by.css('#main-type-document-filter-select option')).get(optionIndex).click();
    }


    export function clickIncreaseGridSizeButton() {

        common.click(element(by.id('increase-grid-size-button')));
    }


    // double click

    export function doubleClickCell(index) {

        return browser.actions().doubleClick(MediaOverviewPage.getCell(index)).perform();
    }


    // mouse moves

    export function clickUploadArea() {

        return browser.actions()
            .mouseMove(element(by.css('.droparea')), {x: 10, y: 10})
            .click()
            .perform();
    }


    // send keys

    export function uploadFile(filePath) {

        return element(by.id('file')).sendKeys(filePath);
    }


    // text

    export function getCellMediaResourceName(index) {

        return MediaOverviewPage.getCell(index).getAttribute('id').then(id => id.substring('resource-'.length));
    }


    export function getGridSizeSliderValue() {

        return element(by.id('grid-size-slider')).getAttribute('value');
    }


    // elements

    export function getLinkModalListEntries() {

        browser.wait(EC.presenceOf(element(by.css('#document-picker ul'))), delays.ECWaitTime);
        return element.all(by.css('#document-picker ul li'));
    }


    export function getAllCells() {

        return element.all(by.css('.cell'));
    }


    export function getCell(index) {

        return MediaOverviewPage.getAllCells().get(index);
    }


    export function getCellByIdentifier(identifier: string) {

        return element(by.id('resource-' + identifier));
    }


    export function getDeleteConfirmationModal() {

        return element(by.css('.modal-dialog'));
    }


    export function getLinkModal() {

        return element(by.id('link-modal'));
    }


    export function typeInIdentifierInLinkModal(identifier) {

        return common.typeIn(MediaOverviewPage.getLinkModal().element(by.id('object-search')), identifier);
    }


    export function getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return MediaOverviewPage.getLinkModal().element(by.id('resource-' + identifier))
    }


    // sequences

    export function createDepictsRelation(identifier) {

        const mediaResourceToConnect = MediaOverviewPage.getCell(0);

        mediaResourceToConnect.click();
        expect(mediaResourceToConnect.getAttribute('class')).toMatch(selectedClass);
        MediaOverviewPage.clickLinkButton();
        MediaOverviewPage.typeInIdentifierInLinkModal(identifier);
        MediaOverviewPage.getSuggestedResourcesInLinkModalByIdentifier(identifier).click();

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToMediaOverview();
        browser.sleep(delays.shortRest * 5);
    }
}