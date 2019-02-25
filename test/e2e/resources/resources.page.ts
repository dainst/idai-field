'use strict';

import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


export class ResourcesPage {

    public static get(view: string = 'project') {

        return browser.get('#/resources/' + view);
    }


    // click

    public static clickCreateResource() {

        common.click(ResourcesPage.getCreateDocumentButton());
    }


    // TODO Move to DoceditPage
    public static clickSaveInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-save-button')));
        browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
    }


    // TODO Move to DoceditPage
    public static clickCancelInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-cancel-button')));
    }


    // TODO Move to DoceditPage
    public static clickDiscardInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-discard-button')));
        browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
    }


    public static clickSelectGeometryType(type?) {

        let geom = 'none';
        if (type) geom = type;
        return common.click(element(by.id('choose-geometry-option-' + geom)));
    }


    public static clickOpenContextMenu(identifier: string) {

        common.rightClick(this.getListItemEl(identifier));
    }


    public static clickContextMenuMoveButton() {

        common.click(element(by.id('context-menu-move-button')));
    }


    public static clickContextMenuDeleteButton() {

        common.click(element(by.id('context-menu-delete-button')));
    }

    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    public static clickSelectObjectByIndex(listIndex) {

        return common.click(element(by.id('objectList')).all(by.tagName('li')).get(listIndex));
    }


    public static clickHierarchyButton(identifier) {

        return common.click(element(by.css('#resource-' + identifier + ' .hierarchy-button')));
    }


    public static clickSelectResource(identifier) {

        return common.click(element(by.id('resource-' + identifier)));
    }


    public static clickMapModeButton() {

        common.click(element(by.id('map-mode-button')));
    }


    public static clickListModeButton() {

        common.click(element(by.id('list-mode-button')));
        browser.actions().mouseUp().mouseMove({x: 200, y: 200}).perform(); // avoid tooltip
    }


    public static clickSwitchHierarchyMode() {

        browser.wait(EC.stalenessOf(element(by.css('.loading-icon'))), delays.ECWaitTime);
        common.click(element(by.id('hierarchy-mode-switch')));
        browser.actions().mouseUp().mouseMove({ x: 200, y: 200 }).perform(); // avoid tooltip
    }


    // TODO Rename
    public static clickMainTypeDocumentNavigationButton() {

        common.click(element(by.id('selected-operation-type-document')));
    }


    public static clickSelectResourceType(typeName: string = 'feature-architecture') {

        return common.click(element(by.id('choose-type-option-' + typeName)));
    }


    public static clickConfirmDeleteInModal() {

        common.click(element(by.id('delete-resource-confirm')));
    };


    public static openEditByDoubleClickResource(identifier: string) {

        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="objectList"]//div[@class="title" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="objectList"]//div[@class="title" and ' +
            'normalize-space(text())="' + identifier + '"]'))).perform();
    }


    public static clickResourceListItemInMoveModal(identifier: string) {

        common.click(element(by.id('document-picker-resource-' + identifier)));
    }


    public static clickCancelInMoveModal() {

        common.click(element(by.id('move-modal-cancel-button')));
    }


    public static clickListEditButton(identifier: string) {

        common.click(element(by.css('#resource-' + identifier + ' .list-edit-button')));
    }


    // get text

    public static getListItemIdentifierText(itemNr: number) {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child('
            + (itemNr + 1) + ') .title'))), delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item:nth-child(' + (itemNr + 1) + ') .title')).getText();
    }


    public static getSelectedListItemIdentifierText() {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item.selected .title'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item.selected .title')).getText();
    }


    public static getListModeInputFieldValue(identifier, index) {

        return ResourcesPage.getListModeInputField(identifier, index).getAttribute('value');
    }


    public static getCreateDocumentButton() {

        return element(by.css('#create-document-button .circular-button'));
    }


    public static getCreateDocumentButtonTypeCharacter() {

        browser.wait(EC.visibilityOf(
            element(by.css('#create-document-button div.type-icon'))),
            delays.ECWaitTime);
        return element(by.css('#create-document-button div.type-icon')).getText();
    }


    public static getListModeTypeLabel(identifier) {

        browser.wait(EC.visibilityOf(
            element(by.css('#resource-' + identifier + ' .list-type-label'))),
            delays.ECWaitTime);
        return element(by.css('#resource-' + identifier + ' .list-type-label')).getText();
    }


    public static getDocumentTeaserTypeCharacter() {

        browser.wait(EC.visibilityOf(element(by.css('.document-teaser div.type-icon'))), delays.ECWaitTime);
        return element(by.css('.document-teaser div.type-icon')).getText();
    }


    public static getConfirmDeletionInputField() {

        return element(by.id('delete-resource-input'));
    }


    // elements

    public static getListItemEl(identifier) {

        return element(by.id('resource-' + identifier));
    }


    public static getListItemEls() {

        return element.all(by.css('.list-group-item'));
    }


    public static getListItemMarkedNewEl() {

        return element(by.css('#objectList .list-group-item .new'));
    }


    public static getListItemMarkedNewEls() {

        return element.all(by.css('#objectList .list-group-item .new'));
    }


    public static getListModeInputField (identifier, index) {

        browser.wait(EC.visibilityOf(element.all(by.css('#resource-' + identifier + ' input')).get(index)),
            delays.ECWaitTime);
        return element.all(by.css('#resource-' + identifier + ' input')).get(index);
    }


    public static getResourceTypeOption(typeName: string) {

        return element(by.id('choose-type-option-' + typeName));
    }


    public static getCreateDocumentButtonTypeIcon() {

        return element(by.css('#create-document-button .type-icon'));
    }


    public static getNavigationButtons() {

        return element.all(by.css('.navigation-button'));
    }


    public static getContextMenu() {

        return element(by.id('context-menu'));
    }


    public static getMoveModal() {

        return element(by.id('move-modal'));
    }


    public static getResourceIdentifierLabelsInMoveModal() {

        return element.all(by.css('#move-modal document-teaser .title'));
    }


    // type in

    public static typeInListModeInputField(identifier: string, index: number, inputText: string) {

        return common.typeIn(this.getListModeInputField(identifier, index), inputText);
    }


    public static typeInNewResourceAndHitEnterInList(inputText: string) {
  
        browser.wait(EC.visibilityOf(element.all(by.css('#list .identifier-input')).first()),
            delays.ECWaitTime);
        common.typeIn(element.all(by.css('#list .identifier-input')).last(), inputText);
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
    }


    public static typeInIdentifierInConfirmDeletionInputField(identifier: string) {

        return common.typeIn(this.getConfirmDeletionInputField(), identifier);
    }


    public static typeInMoveModalSearchBarInput(identifier: string) {

        return common.typeIn(this.getMoveModal().element(by.css('.search-bar-input')), identifier);
    }


    // sequences

    public static performCreateResource(identifier: string, typeName?: string, inputFieldName?: string,
                                        inputFieldText?: string, skipGeometry?: boolean,
                                        clickMsgAway: boolean = true, waitForModalToClose: boolean = true) {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType(typeName);
        if (!skipGeometry) ResourcesPage.clickSelectGeometryType();
        DoceditPage.clickFieldsTab();
        DoceditPage.typeInInputField('identifier', identifier);
        if (inputFieldName && inputFieldText) {
            DoceditPage.typeInInputField(inputFieldName, inputFieldText);
        }
        ResourcesPage.scrollUp();
        DoceditPage.clickSaveDocument(clickMsgAway, waitForModalToClose);
    }


    public static performCreateResourceInList(identifier: string, typeName: string) {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType(typeName);
        ResourcesPage.typeInNewResourceAndHitEnterInList(identifier);
    }


    public static performCreateOperation(identifier: string) {

        NavbarPage.navigate('project');
        this.performCreateResource(identifier, 'trench');
        this.clickHierarchyButton(identifier);
    }


    public static performCreateRelation(identifier: string, targetIdentifier: string,
                                                   relationGroupIndex: number) {

        ResourcesPage.openEditByDoubleClickResource(identifier);
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(relationGroupIndex);
        DoceditRelationsTabPage.typeInRelationByIndices(relationGroupIndex, 0, targetIdentifier);
        DoceditRelationsTabPage.clickChooseRelationSuggestion(relationGroupIndex, 0, 0);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    }


    public static performCreateLink() {

        ResourcesPage.performCreateResource('1', "feature-architecture");
        ResourcesPage.performCreateResource('2', "feature-architecture");
        ResourcesPage.performCreateRelation('2', '1', 6);   //isBefore
    }


    // script

    public static scrollDown() {

        return browser.executeScript('window.scrollTo(0,200);');
    }


    public static scrollUp() {

        return browser.executeScript('window.scrollTo(0,0);');
    }

}