'use strict';

import {browser, protractor, element, by} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common.js');


export module ImageOverviewPage {

    export const selectedClass = 'selected';


    export function get() {

        browser.get('#/images');
    }


    export function getAndWaitForImageCells() {

        ImageOverviewPage.get();
        ImageOverviewPage.waitForCells();
    }


    export function waitForCells() {

        return browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime,
            'Waiting for image cells.');
    }


    // click

    export function clickCell(index) {

        return ImageOverviewPage.getCell(index).click();
    }


    export function chooseImageSubtype(index) {

        return common.click(element(by.id('choose-image-subtype-option-' + index)));
    }


    export function clickDeselectButton() {

        return common.click(element(by.id('deselect-images')));
    }


    export function clickDeleteButton() {

        return common.click(element(by.id('delete-images')));
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


    export function clickCancelLinkModalButton() {

        return common.click(element(by.id('link-modal-cancel-button')));
    }


    export function clickConfirmDeleteButton() {

        return common.click(element(by.id('delete-images-confirm')));
    }


    export function clickCancelDeleteButton() {

        return common.click(element(by.id('delete-images-cancel')));
    }


    export function clickSelectLinkFilterOption(optionIndex: number) {

        browser.wait(EC.presenceOf(element(by.id('link-filter-select'))), delays.ECWaitTime);
        element.all(by.css('#link-filter-select option')).get(optionIndex).click();
    }


    export function clickIncreaseGridSizeButton() {

        common.click(element(by.id('increase-grid-size-button')));
    }


    // double click

    export function doubleClickCell(index) {

        browser.actions().doubleClick(ImageOverviewPage.getCell(index)).perform();
    }


    // mouse moves

    export function clickUploadArea() {

        return browser.actions()
            .mouseMove(element(by.css('.droparea')), {x: 10, y: 10})
            .click()
            .perform();
    }


    // send keys

    export function uploadImage(filePath) {

        return element(by.id('file')).sendKeys(filePath);
    }


    // text

    export function getCellImageName(index) {

        return ImageOverviewPage.getCell(index).getAttribute('id').then(id => id.substring('resource-'.length));
    }


    export function getGridSizeSliderValue() {

        return element(by.id('grid-size-slider')).getAttribute('value');
    }

    // elements

    export function getAllCells() {

        return element.all(by.css('.cell'));
    }


    export function getCell(index) {

        return ImageOverviewPage.getAllCells().get(index);
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


    export function getLinkModalListEntries() {

        browser.wait(EC.presenceOf(element(by.css('#document-picker ul'))), delays.ECWaitTime);
        return element.all(by.css('#document-picker ul li'));
    }


    export function getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return ImageOverviewPage.getLinkModal().element(by.id('document-picker-resource-' + identifier))
    }


    // type in

    export function typeInIdentifierInLinkModal(identifier) {

        return common.typeIn(ImageOverviewPage.getLinkModal().element(by.css('.search-bar-input')), identifier);
    }


    // sequences

    export function createDepictsRelation(identifier) {

        const imageToConnect = ImageOverviewPage.getCell(0);

        imageToConnect.click();
        expect(imageToConnect.getAttribute('class')).toMatch(selectedClass);
        ImageOverviewPage.clickLinkButton();
        ImageOverviewPage.typeInIdentifierInLinkModal(identifier);
        ImageOverviewPage.getSuggestedResourcesInLinkModalByIdentifier(identifier).click();
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');
        MenuPage.navigateToImages();
        browser.sleep(delays.shortRest * 5);
    }
}