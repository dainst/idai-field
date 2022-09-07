import { click, getElement, getElements, rightClick, hover, waitForNotExist, doubleClick, getText,
    typeIn, pressKeys, getValue } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { NavbarPage } from '../navbar.page';


export class ResourcesPage {

    // click

    public static async clickCreateResource() {

        return click(await ResourcesPage.getCreateDocumentButton());
    }


    public static clickSelectGeometryType(geometryType: string = 'none') {

        return click('#choose-geometry-option-' + geometryType);
    }


    public static async clickOpenContextMenu(identifier: string) {

        return rightClick(await this.getListItemEl(identifier));
    }


    public static clickContextMenuMoveButton() {

        return click('#context-menu-move-button');
    }


    public static clickContextMenuImagesButton() {

        return click('#context-menu-images-button');
    }


    public static clickContextMenuDeleteButton() {

        return click('#context-menu-delete-button');
    }


    public static clickHierarchyButton(identifier: string) {

        return click('#resource-' + identifier + ' .hierarchy-button');
    }


    public static clickOpenChildCollectionButton() {

        return click('#open-child-collection-button');
    }


    public static async clickThumbnail() {

        return click(await this.getThumbnail());
    }


    public static async clickSelectResource(identifier: string, tab?: 'info' | 'children') {

        await hover('#resource-' + identifier);

        let buttonClass = '';
        if (tab) {
            if (tab === 'info') buttonClass = '.info-button';
            if (tab === 'children') buttonClass = '.hierarchy-button';
        }
        return click('#resource-' + identifier + ' ' + buttonClass);
    }


    public static clickMapModeButton() {

        return click('#map-mode-button');
    }


    public static clickListModeButton() {

        return click('#list-mode-button');
    }


    public static async clickSwitchHierarchyMode() {

        await waitForNotExist('.loading-icon');
        return click('#hierarchy-mode-switch');
    }


    public static clickOperationNavigationButton() {

        return click('#selected-operation');
    }


    public static clickNavigationButton(identifier: string) {

        return click('#navigation-button-' + identifier);
    }


    public static clickSelectCategory(categoryName: string = 'feature-architecture') {

        return click('#choose-category-option-' + categoryName);
    }


    public static clickConfirmDeleteInModal() {

        return click('#delete-resource-confirm');
    };


    public static openEditByDoubleClickResource(identifier: string) {

        return doubleClick('//*[@id="sidebar"]//div[@class="title" and ' +
            'normalize-space(text())="' + identifier + '"]');
    }


    public static clickResourceListItemInMoveModal(identifier: string) {

        return click('#document-picker-resource-' + identifier);
    }


    public static clickCancelInMoveModal() {

        return click('#move-modal-cancel-button');
    }


    public static clickListEditButton(identifier: string) {

        return click('#resource-' + identifier + ' .list-edit-button');
    }


    public static clickListMoveButton(identifier: string) {

        return click('#resource-' + identifier + ' .list-move-button');
    }


    public static clickListDeleteButton(identifier: string) {

        return click('#resource-' + identifier + ' .list-delete-button');
    }


    // get text


    public static getListItemIdentifierText(itemNr: number) {

        return getText('#sidebar .resources-listing-item:nth-child(' + (itemNr + 1) + ') .title');
    }


    public static getSelectedListItemIdentifierText() {

        return getText('#sidebar .resources-listing-item.selected .title');
    }


    public static getSelectedListItemShortDescriptionText() {

        return getText('#sidebar .resources-listing-item.selected .subtitle');
    }


    public static async getListModeInputFieldValue(identifier, index) {

        const inputField = await ResourcesPage.getListModeInputField(identifier, index);
        return getValue(inputField);
    }


    public static getCreateDocumentButtonCategoryCharacter() {

        return getText('#create-document-button div.category-icon');
    }


    public static getListModeCategoryLabel(identifier) {

        return getText('#resource-' + identifier + ' .list-category-label');
    }


    public static getDocumentTeaserCategoryCharacter() {

        return getText('.document-teaser div.category-icon');
    }


    // elements

    public static getListItemEl(identifier) {

        return getElement('#resource-' + identifier);
    }


    public static getListItemEls() {

        return getElements('#sidebar .resources-listing-item');
    }


    public static getListItemMarkedNewEl() {

        return getElement('#sidebar .resources-listing-item .new');
    }


    public static getListItemMarkedNewEls() {

        return getElements('#sidebar .resources-listing-item .new');
    }


    public static async getListModeInputField(identifier, index) {

        return (await getElements('#resource-' + identifier + ' input'))[index];
    }


    public static getThumbnail() {

        return getElement('.thumbnail-container');
    }


    public static getCategoryOption(categoryName: string) {

        return getElement('#choose-category-option-' + categoryName);
    }


    public static getCreateDocumentButton() {

        return getElement('#create-document-button .circular-button');
    }


    public static getCreateDocumentButtonCategoryIcon() {

        return getElement('#create-document-button .category-icon');
    }


    public static getNavigationButtons() {

        return getElements('.navigation-button');
    }


    public static getContextMenu() {

        return getElement('#context-menu');
    }


    public static getConfirmDeletionInputField() {

        return getElement('#delete-resource-input');
    }


    public static getMoveModal() {

        return getElement('#move-modal');
    }


    public static getResourceIdentifierLabelsInMoveModal() {

        return getElements('#move-modal document-teaser .title');
    }


    public static getListRows() {

        return getElements('.row-wrapper');
    }


    // type in

    public static async typeInListModeInputField(identifier: string, index: number, inputText: string) {

        return typeIn(await this.getListModeInputField(identifier, index), inputText);
    }


    public static async typeInNewResourceAndHitEnterInList(inputText: string) {

        const elements = await getElements('#list .identifier-input');
        await typeIn(elements[elements.length - 1], inputText);
        return pressKeys(['Enter']);
    }


    public static async typeInIdentifierInConfirmDeletionInputField(identifier: string) {

        return typeIn(await this.getConfirmDeletionInputField(), identifier);
    }


    public static typeInMoveModalSearchBarInput(identifier: string) {

        return typeIn('#move-modal .search-bar-input', identifier);
    }


    // sequences

    public static async performCreateResource(identifier: string, categoryName?: string, inputFieldName?: string,
                                              inputFieldText?: string, skipTypeSelect?: boolean, skipGeometry?: boolean,
                                              waitForModalToClose: boolean = true) {

        await this.clickCreateResource();
        if (!skipTypeSelect) await this.clickSelectCategory(categoryName);
        if (!skipGeometry) await this.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', identifier);
        if (inputFieldName && inputFieldText) {
            await DoceditPage.typeInInputField(inputFieldName, inputFieldText);
        }
        await DoceditPage.clickSaveDocument(false, waitForModalToClose);
    }


    public static async performDescendHierarchy(identifier: string) {

        await this.clickHierarchyButton(identifier);
        return click('#open-child-collection-button');
    }


    public static async performCreateResourceInList(identifier: string, categoryName: string) {

        await this.clickCreateResource();
        await this.clickSelectCategory(categoryName);
        await this.typeInNewResourceAndHitEnterInList(identifier);
    }


    public static async performCreateTrench(identifier: string) {

        await NavbarPage.clickTab('project');
        await this.performCreateResource(identifier, 'operation-trench');
        await this.clickHierarchyButton(identifier);
    }


    public static async performCreateRelation(identifier: string, targetIdentifier: string,
                                              relationName: string) {

        await this.openEditByDoubleClickResource(identifier);
        await DoceditPage.clickGotoTimeTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex(relationName);
        await DoceditRelationsPage.typeInRelation(relationName, targetIdentifier);
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();
    }


    public static async performCreateLink() {

        await this.performCreateResource('1', 'feature-architecture');
        await this.performCreateResource('2', 'feature-architecture');
        await this.performCreateRelation('2', '1', 'isBefore');
    }

    // script

    /*public static scrollUp() {

        return browser.executeScript('window.scrollTo(0,0);');
    }*/
}
