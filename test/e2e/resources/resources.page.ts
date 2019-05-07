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


    public static clickJumpToResourcesViewButton(identifier: string) {

        return common.click(element(by.id('jump-to-resources-view-button-' + identifier)));
    }


    public static clickHierarchyButton(identifier: string) {

        return common.click(element(by.css('#resource-' + identifier + ' .hierarchy-button')));
    }


    public static clickJumpToMatrixViewButton(identifier: string) {

        return common.click(element(by.id('jump-to-matrix-view-button-' + identifier)));
    }


    public static clickSelectResource(identifier: string, tab?: 'info' | 'links' | 'children') {

        let buttonClass = '';
        if (tab) {
            if (tab === 'info') buttonClass = '.info-button';
            if (tab === 'links') buttonClass = '.link-button';
            if (tab === 'children') buttonClass = '.hierarchy-button';
        }
        return common.click(element(by.css('#resource-' + identifier + ' ' + buttonClass)));
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


    public static clickOperationNavigationButton() {

        common.click(element(by.id('selected-operation')));
    }


    public static clickSelectResourceType(typeName: string = 'feature-architecture') {

        return common.click(element(by.id('choose-type-option-' + typeName)));
    }


    public static clickConfirmDeleteInModal() {

        common.click(element(by.id('delete-resource-confirm')));
    };


    public static openEditByDoubleClickResource(identifier: string) {

        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="sidebar"]//div[@class="title" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="sidebar"]//div[@class="title" and ' +
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


    public static clickListMoveButton(identifier: string) {

        common.click(element(by.css('#resource-' + identifier + ' .list-move-button')));
    }


    public static clickListDeleteButton(identifier: string) {

        common.click(element(by.css('#resource-' + identifier + ' .list-delete-button')));
    }


    // get text

    public static getListItemIdentifierText(itemNr: number) {

        browser.wait(EC.visibilityOf(element(by.css('#sidebar .resources-listing-item:nth-child('
            + (itemNr + 1) + ') .title'))), delays.ECWaitTime);
        return element(by.css('#sidebar .resources-listing-item:nth-child(' + (itemNr + 1) + ') .title')).getText();
    }


    public static getSelectedListItemIdentifierText() {

        browser.wait(EC.visibilityOf(element(by.css('#sidebar .resources-listing-item.selected .title'))),
            delays.ECWaitTime);
        return element(by.css('#sidebar .resources-listing-item.selected .title')).getText();
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

        return element.all(by.css('#sidebar .resources-listing-item'));
    }


    public static getListItemMarkedNewEl() {

        return element(by.css('#objectList .list-group-item .new'));
    }


    public static getListItemMarkedNewEls() {

        return element.all(by.css('#sidebar .resources-listing-item .new'));
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


    public static getListRows() {

        return element.all(by.css('.row-wrapper'));
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

        this.clickCreateResource();
        this.clickSelectResourceType(typeName);
        if (!skipGeometry) ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', identifier);
        if (inputFieldName && inputFieldText) {
            DoceditPage.typeInInputField(inputFieldName, inputFieldText);
        }
        DoceditPage.clickSaveDocument(clickMsgAway, waitForModalToClose);
    }


    public static performDescendHierarchy(identifier: string) {

        this.clickHierarchyButton(identifier);
        return common.click(element(by.id('open-child-collection-button')));
    }


    public static performCreateResourceInList(identifier: string, typeName: string) {

        this.clickCreateResource();
        this.clickSelectResourceType(typeName);
        this.typeInNewResourceAndHitEnterInList(identifier);
    }


    public static performCreateOperation(identifier: string) {

        NavbarPage.clickTab('project');
        this.performCreateResource(identifier, 'trench');
        this.performJumpToTrenchView(identifier);
    }


    public static performCreateRelation(identifier: string, targetIdentifier: string,
                                                   relationGroupIndex: number) {

        this.openEditByDoubleClickResource(identifier);
        DoceditPage.clickGotoTimeTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(relationGroupIndex);
        DoceditRelationsTabPage.typeInRelationByIndices(relationGroupIndex, 0, targetIdentifier);
        DoceditRelationsTabPage.clickChooseRelationSuggestion(relationGroupIndex, 0, 0);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    }


    public static performCreateLink() {

        this.performCreateResource('1', "feature-architecture");
        this.performCreateResource('2', "feature-architecture");
        this.performCreateRelation('2', '1', 1);   //isBefore
    }


    public static performJumpToTrenchView(identifier: string) { // TODO remove

        this.clickHierarchyButton(identifier);
    }


    public static performJumpToMatrixView(identifier: string) { // TODO remvoe

        this.clickHierarchyButton(identifier);
        this.clickJumpToMatrixViewButton(identifier);
    }


    // script

    public static scrollDown() {

        return browser.executeScript('window.scrollTo(0,200);');
    }


    public static scrollUp() {

        return browser.executeScript('window.scrollTo(0,0);');
    }
}