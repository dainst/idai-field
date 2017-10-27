import {browser, protractor, element, by} from 'protractor';

'use strict';
let common = require('../common.js');
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';


export class ResourcesPage {

    public static get = function() {

        return browser.get('#/resources/excavation');
    };

    // click

    public static clickCreateResource() {

        common.click(element(by.css('#create-document-button .circular-button')));
    };

    public static clickCreateMainTypeResource() {

        common.click(element(by.css('#create-main-type-document-button .circular-button')));
    };

    public static clickEditMainTypeResource() {

        common.click(element(by.id('edit-main-type-document-button')));
    };

    public static clickSaveInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-save-button')));
    };

    public static clickCancelInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-cancel-button')));
    };

    public static clickDiscardInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-discard-button')));
    };

    public static clickSelectGeometryType(type?) {

        let geom = 'none';
        if (type) geom = type;
        return common.click(element(by.id('choose-geometry-option-' + geom)));
    };

    /**
     * @deprecated use selectObjectByIdentifier instead
     */
    public static clickSelectObjectByIndex(listIndex) {

        return common.click(element(by.id('objectList')).all(by.tagName('li')).get(listIndex));
    };

    public static clickGoToMainTypeViewByIdentifier(identifier) {

        return common.click(element(by.css('#resource-'+identifier + ' .selectInMainTypeViewBtn')));
    }

    public static clickSelectResource(identifier) {

        return common.click(element(by.xpath('//*[@id="objectList"]//div[@class="title" and normalize-space(text())="'
            + identifier + '"]')));
    };

    public static clickMapModeButton() {

        common.click(element(by.id('map-mode-button')));
    };

    public static clickListModeButton() {

        common.click(element(by.id('list-mode-button')));
    };

    public static clickSelectResourceType(typeName?) {

        if (!typeName) typeName = "feature-architecture";
        return common.click(element(by.id('choose-type-option-' + typeName)));
    };

    public static clickSelectMainTypeDocument(optionIndex) {

        browser.wait(EC.presenceOf(element(by.id('mainTypeSelectBox'))), delays.ECWaitTime);
        element.all(by.css('#mainTypeSelectBox option')).get(optionIndex).click();
    };

    public static openEditByDoubleClickResource(identifier) {

        browser.wait(EC.visibilityOf(
            element(by.xpath('//*[@id="objectList"]//div[@class="title" and normalize-space(text())="'
                + identifier + '"]'))), delays.ECWaitTime);
        return browser.actions().doubleClick(element(by.xpath('//*[@id="objectList"]//div[@class="title" and ' +
            'normalize-space(text())="' + identifier + '"]'))).perform();
    };

    // get text

    public static getListItemIdentifierText(itemNr) {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item:nth-child('
            + (itemNr + 1) + ') .title'))), delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item:nth-child(' + (itemNr + 1) + ') .title')).getText();
    };

    public static getSelectedListItemIdentifierText() {

        browser.wait(EC.visibilityOf(element(by.css('#objectList .list-group-item.selected .title'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item.selected .title')).getText();
    };

    public static getSelectedMainTypeDocumentOption() {

        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBox option:checked'))), delays.ECWaitTime);
        return element.all(by.css('#mainTypeSelectBox option:checked')).getText();
    };

    public static getMainTypeDocumentOption() {

        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBox'))), delays.ECWaitTime);
        return element.all(by.css('#mainTypeSelectBox')).getText();
    };

    public static getListModeInputFieldValue(identifier, index) {

        return ResourcesPage.getListModeInputField(identifier, index).getAttribute('value');
    };

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

    // elements

    public static getListItemEl(identifier) {

        return element(by.id('resource-' + identifier));
    };

    public static getListItemEls() {

        browser.wait(EC.visibilityOf(
            element.all(by.css('#objectList .list-group-item')).first()),
            delays.ECWaitTime);
        return element.all(by.css('.list-group-item'));
    };

    public static getListItemMarkedNewEl() {

        browser.wait(EC.visibilityOf(
            element(by.css('#objectList .list-group-item .new'))),
            delays.ECWaitTime);
        return element(by.css('#objectList .list-group-item .new'));
    };

    public static getListItemMarkedNewEls() {

        browser.wait(EC.visibilityOf(
            element.all(by.css('#objectList .list-group-item .new')).first()),
            delays.ECWaitTime);
        return element.all(by.css('#objectList .list-group-item .new'));
    };

    public static getListModeInputField (identifier, index) {

        browser.wait(EC.visibilityOf(element.all(by.css('#resource-' + identifier + ' input')).get(index)),
            delays.ECWaitTime);
        return element.all(by.css('#resource-' + identifier + ' input')).get(index);
    };

    public static getResourceTypeOption(typeName: string) {

        return element(by.id('choose-type-option-' + typeName));
    }

    public static getCreateDocumentButtonTypeIcon() {

        return element(by.css('#create-document-button .type-icon'));
    }


    // sequences

    public static performCreateResource(identifier: string, typeName?: string, inputFieldName?: string,
                                                   inputFieldText?: string, skipGeometry?: boolean) {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType(typeName);
        if (!skipGeometry) ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', identifier);
        if (inputFieldName && inputFieldText) {
            DoceditPage.typeInInputField(inputFieldName, inputFieldText);
        }
        ResourcesPage.scrollUp();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    public static performCreateMainTypeResource(identifier: string) {

        ResourcesPage.clickCreateMainTypeResource();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', identifier);
        ResourcesPage.scrollUp();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    public static performCreateRelation(identifier: string, targetIdentifier: string,
                                                   relationGroupIndex: number) {

        ResourcesPage.openEditByDoubleClickResource(identifier);
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(relationGroupIndex);
        DoceditRelationsTabPage.typeInRelationByIndices(relationGroupIndex, 0, targetIdentifier);
        DoceditRelationsTabPage.clickChooseRelationSuggestion(relationGroupIndex, 0, 0);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
    };

    public static performCreateLink() {

        ResourcesPage.performCreateResource('1', "feature-architecture");
        ResourcesPage.performCreateResource('2', "feature-architecture");
        ResourcesPage.performCreateRelation('2', '1', 1);
    };

    // script

    public static scrollDown() {

        return browser.executeScript('window.scrollTo(0,200);');
    };

    public static scrollUp() {

        return browser.executeScript('window.scrollTo(0,0);');
    };

    // type in

    public static typeInListModeInputField(identifier, index, inputText) {

        return common.typeIn(this.getListModeInputField(identifier, index), inputText);
    };
}