import { click, getLocator, rightClick, hover, waitForNotExist, doubleClick, getText, typeIn, pressKey,
    pause, getValue, selectOption } from '../app';
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

        return click(this.getContextMenuMoveButton());
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

        return click(this.getListButton('edit', identifier));
    }


    public static clickListMoveButton(identifier: string) {

        return click(this.getListButton('move', identifier));
    }


    public static clickListDeleteButton(identifier: string) {

        return click(this.getListButton('delete', identifier));
    }


    public static clickListSelectOption(identifier: string, optionValue: string) {

        return selectOption('#resource-' + identifier + ' .dropdown-input-field select', optionValue);
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


    public static getListSelectValue(identifier: string) {

        return getValue('#resource' + identifier + ' .dropdown-input-field select');
    }


    // elements

    public static getListItemEl(identifier) {

        return getLocator('#resource-' + identifier);
    }


    public static getListItemEls() {

        return getLocator('#sidebar .resources-listing-item');
    }


    public static getListItemMarkedNewEl() {

        return getLocator('#sidebar .resources-listing-item .new');
    }


    public static getListItemMarkedNewEls() {

        return getLocator('#sidebar .resources-listing-item .new');
    }


    public static async getListModeInputField(identifier, index) {

        const locator = identifier
            ? getLocator('#resource-' + identifier + ' input')
            : getLocator('#new-resource input');

        return (await locator).nth(index);
    }


    public static getThumbnail() {

        return getLocator('.thumbnail-container');
    }


    public static getCategoryOption(categoryName: string) {

        return getLocator('#choose-category-option-' + categoryName);
    }


    public static getCreateDocumentButton() {

        return getLocator('#create-document-button .circular-button');
    }


    public static getCreateDocumentButtonCategoryIcon() {

        return getLocator('#create-document-button .category-icon');
    }


    public static getNavigationButtons() {

        return getLocator('.navigation-button');
    }


    public static getContextMenu() {

        return getLocator('#context-menu');
    }


    public static getConfirmDeletionInputField() {

        return getLocator('#delete-resource-input');
    }


    public static getMoveModal() {

        return getLocator('#move-modal');
    }


    public static getResourceIdentifierLabelsInMoveModal() {

        return getLocator('#move-modal document-teaser .title');
    }


    public static getListRows() {

        return getLocator('.row-wrapper');
    }


    public static getListButton(type: 'edit'|'move'|'delete', identifier?: string) {

        const buttonClass: string = '.list-' + type + '-button';

        return identifier
            ? getLocator('#resource-' + identifier + ' ' + buttonClass)
            : getLocator('#new-resource ' + buttonClass);
    }


    public static getContextMenuMoveButton() {

        return getLocator('#context-menu-move-button');
    }


    // type in

    public static async typeInListModeInputField(identifier: string, index: number, inputText: string) {

        return typeIn(await this.getListModeInputField(identifier, index), inputText);
    }


    public static async typeInNewResourceAndHitEnterInList(inputText: string) {

        const elements = await getLocator('#list .identifier-input');
        const element = elements.nth(await elements.count() - 1);
        await typeIn(element, inputText);
        await pause(2000);
        await pressKey(element, 'Enter');
        return pause(2000);
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
}
