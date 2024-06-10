import { click, doubleClick, getLocator, getValue, navigateTo, selectFile, typeIn, waitForExist,
    waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';

const { expect } = require('@playwright/test');


export module ImageOverviewPage {

    export async function waitForCells() {

        return waitForExist((await getLocator('.cell')).nth(0));
    }


    // click

    export async function clickCell(index) {

        return click(await ImageOverviewPage.getCell(index));
    }


    export function chooseImageSubcategory(index) {

        return click('#choose-image-subcategory-option-' + index);
    }


    export function clickUploadConfirm() {

        return click('#confirmUploadButton');
    }


    export function selectStaffAsDraughtsmen(name: string) {

        return click(`input[type="checkbox"][value="${name}"]`);
    }


    export function clickDeselectButton() {

        return click('#deselect-images');
    }


    export function clickDeleteButton() {

        return click('#delete-images');
    }


    export function clickConfirmUnlinkButton() {

        return click('#remove-link-confirm');
    }


    export function clickLinkButton() {

        return click('#create-link-btn');
    }


    export function clickUnlinkButton() {

        return click('#remove-link-btn');
    }


    export function clickCancelLinkModalButton() {

        return click('#link-modal-cancel-button');
    }


    export function clickConfirmDeleteButton() {

        return click('#delete-images-confirm');
    }


    export function clickCancelDeleteButton() {

        return click('#delete-images-cancel');
    }


    export function clickIncreaseGridSizeButton() {

        return click('#increase-grid-size-button');
    }


    // double click

    export async function doubleClickCell(index) {

        return doubleClick(await ImageOverviewPage.getCell(index));
    }


    // upload image

    export function uploadImage(filePath) {

        return selectFile('.droparea', filePath);
    }


    // text

    export async function getCellImageName(index) {

        const cell = await ImageOverviewPage.getCell(index);
        return (await cell.getAttribute('id')).substring('resource-'.length);
    }


    export async function getGridSizeSliderValue() {

        const element = await getLocator('#grid-size-slider');
        return getValue(element);
    }


    // elements

    export function getAllCells() {

        return getLocator('.cell');
    }


    export async function getCell(index) {

        return (await ImageOverviewPage.getAllCells()).nth(index);
    }


    export function getCellByIdentifier(identifier: string) {

        return getLocator('#resource-' + identifier.replace('.', '_'));
    }


    export function getDeleteConfirmationModal() {

        return getLocator('#delete-modal-body');
    }


    export function getLinkModal() {

        return getLocator('#link-modal');
    }


    export async function getLinkModalListEntries() {

        await waitForExist('#document-picker ul');
        return getLocator('#document-picker ul li');
    }


    export function getSuggestedResourcesInLinkModalByIdentifier(identifier) {

        return getLocator('#document-picker-resource-' + identifier);
    }


    export function getSavingChangesModal() {

        return getLocator('#saving-changes-modal');
    }


    // type in

    export async function typeInIdentifierInLinkModal(identifier) {
        
        const linkModalElement = await ImageOverviewPage.getLinkModal();
        return typeIn(await linkModalElement.locator('.search-bar-input'), identifier);
    }


    // sequences

    export async function createDepictsRelation(identifier) {

        const imageToConnect = await ImageOverviewPage.getCell(0);
        await click(imageToConnect);
        expect(await imageToConnect.getAttribute('class')).toMatch('selected');

        await this.clickLinkButton();
        await this.typeInIdentifierInLinkModal(identifier);
        await click(await this.getSuggestedResourcesInLinkModalByIdentifier(identifier));
        await waitForNotExist('ngb-modal-backdrop');

        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        return navigateTo('images');
    }
}
