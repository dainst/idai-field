'use strict';

import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


export class ResourcesPage {

    public static get() {

        return browser.get('#/resources/excavation');
    }


    // click

    public static clickCreateResource() {

        common.click(ResourcesPage.getCreateDocumentButton());
    }


    public static clickSaveInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-save-button')));
    }


    public static clickCancelInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-cancel-button')));
    }


    public static clickDiscardInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-discard-button')));
    }


    public static clickSelectGeometryType(type?) {

        let geom = 'none';
        if (type) geom = type;
        return common.click(element(by.id('choose-geometry-option-' + geom)));
    }


    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    public static clickSelectObjectByIndex(listIndex) {

        return common.click(element(by.id('objectList')).all(by.tagName('li')).get(listIndex));
    }


    public static clickMoveIntoButton(identifier) {

        return common.click(element(by.css('#resource-' + identifier + ' .move-into-button')));
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


    public static clickMainTypeDocumentNavigationButton() {

        common.click(element(by.id('selected-operation-type-document')));
    }


    public static clickSelectResourceType(typeName?) {

        if (!typeName) typeName = "feature-architecture";
        return common.click(element(by.id('choose-type-option-' + typeName)));
    }


    public static openEditByDoubleClickResource(identifier) {

        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="objectList"]//div[@class="title" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="objectList"]//div[@class="title" and ' +
            'normalize-space(text())="' + identifier + '"]'))).perform();
    }


    public static clickFirstSuggestion() {

        return common.click(ResourcesPage.getFirstSuggestion());
    }


    // get text

    public static getListItemIdentifierText(itemNr) {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child('
            + (itemNr + 1) + ') .title'))), delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item:nth-child(' + (itemNr + 1) + ') .title')).getText();
    }


    public static getSelectedListItemIdentifierText() {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item.selected .title'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item.selected .title')).getText();
    }


    public static getSelectedMainTypeDocumentOption() {

        browser.wait(EC.presenceOf(element(by.id('selected-operation-type-document'))), delays.ECWaitTime);
        return element(by.id('selected-operation-type-document')).getText();
    }


    public static getMainTypeDocumentOption() {

        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBox'))), delays.ECWaitTime);
        return element.all(by.css('#mainTypeSelectBox')).getText();
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


    public static isListMode() {

        let listBtn = element(by.css('#map-mode-button.active'));
        return listBtn.isPresent();
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


    public static getSuggestionsBox() {

        return element(by.id('search-suggestions'));
    }


    public static getSuggestions() {

        return element.all(by.css('.suggestion-container .title'));
    }


    public static getFirstSuggestion() {

        return element(by.css('.suggestion-container .title'));
    }


    // type in

    public static typeInListModeInputField(identifier, index, inputText) {

        return common.typeIn(this.getListModeInputField(identifier, index), inputText);
    }


    public static typeInNewResourceAndHitEnterInList (inputText) {
  
        browser.wait(EC.visibilityOf(element.all(by.css('#list .identifier-input')).first()), delays.ECWaitTime);
        common.typeIn(element.all(by.css('#list .identifier-input')).last(), inputText);
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
    }


    // sequences

    public static performCreateResource(identifier: string, typeName?: string, inputFieldName?: string,
                                                   inputFieldText?: string, skipGeometry?: boolean, clickMsgAway: boolean = true) {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType(typeName);
        if (!skipGeometry) ResourcesPage.clickSelectGeometryType();
        DoceditPage.clickFieldsTab();
        DoceditPage.typeInInputField('identifier', identifier);
        if (inputFieldName && inputFieldText) {
            DoceditPage.typeInInputField(inputFieldName, inputFieldText);
        }
        ResourcesPage.scrollUp();
        DoceditPage.clickSaveDocument(clickMsgAway);
    }


    public static performCreateResourceInList(identifier: string, typeName: string) {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType(typeName);
        ResourcesPage.typeInNewResourceAndHitEnterInList(identifier);
    }


    public static performCreateMainTypeResource(identifier: string) {

        NavbarPage.clickNavigateToProject();
        this.performCreateResource(identifier, 'trench');
        this.clickMoveIntoButton(identifier);
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
        ResourcesPage.performCreateRelation('2', '1', 1);
    }


    // script

    public static scrollDown() {

        return browser.executeScript('window.scrollTo(0,200);');
    }


    public static scrollUp() {

        return browser.executeScript('window.scrollTo(0,0);');
    }

}