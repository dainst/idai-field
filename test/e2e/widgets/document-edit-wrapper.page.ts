import {browser, protractor, element, by} from 'protractor';

let common = require("../common.js");
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DocumentEditWrapperPage {

    public static clickChooseRelationSuggestion = function(groupIndex, pickerIndex, suggestionIndex) {
        browser.wait(EC.visibilityOf(element.all(by.css('.suggestion')).get(suggestionIndex)), delays.ECWaitTime);
        this.getRelationEl(groupIndex, pickerIndex)
            .all(by.css('.suggestion')).get(suggestionIndex).click();
    };

     public static clickBackToDocumentView() {
        browser.wait(EC.visibilityOf(element(by.id('document-edit-button-goto-view'))), delays.ECWaitTime);
        element(by.id('document-edit-button-goto-view')).click();
    };

    public static clickAddRelationForGroupWithIndex = function(groupIndex) {
        element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .element(by.css('.circular-button.add-relation')).click();
    };

    public static clickRelationDeleteButtonByIndices = function(groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationEl(groupIndex, pickerIndex).all(by.css('.delete-relation')).get(suggestionIndex)
            .click();
    };

    public static clickFieldsTab = function() {
        element(by.id('document-edit-fields-tab')).click();
    };

    public static clickRelationsTab = function() {
        element(by.id('document-edit-relations-tab')).click();
    };

    public static clickConflictsTab = function() {
        element(by.id('document-edit-conflicts-tab')).click();
    };

    public static clickSaveDocument = function() {
        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-save-document'))), delays.ECWaitTime)
            .then(function() {
                element(by.id('document-edit-button-save-document')).click().then(
                    function() {
                        return new Promise(function(resolve) {
                            setTimeout(function() {
                                resolve();
                            }, delays.shortRest);
                        })
                    }
                )
            });
    };

    public static clickChooseRightRevision = function() {
        browser.wait(EC.visibilityOf(element.all(by.css('.conflict-resolver-field')).get(1)), delays.ECWaitTime);
        element.all(by.css('.conflict-resolver-field')).get(1).click();
    };

    public static clickSolveConflictButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('solve-conflict-button'))), delays.ECWaitTime);
        element(by.id('solve-conflict-button')).click();
    };

    public static clickConflictModalSaveButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('conflict-modal-save-button'))), delays.ECWaitTime);
        element(by.id('conflict-modal-save-button')).click();
    };

    public static clickConflictModalReloadButton = function() {
        browser.wait(EC.visibilityOf(element(by.id('conflict-modal-reload-button'))), delays.ECWaitTime);
        element(by.id('conflict-modal-reload-button')).click();
    };

    // get text

    public static getRelationButtonText = function(groupIndex, pickerIndex, relationIndex) {
        this.clickRelationsTab();
        return this.getRelationButtonEl(groupIndex, pickerIndex, relationIndex).element(by.tagName('span')).getText();
    };

    public static getInputFieldValue = function(index) {
        browser.wait(EC.visibilityOf(element.all(by.css('dai-input input')).get(index)), delays.ECWaitTime);
        return element.all(by.tagName('dai-input input')).get(index).getAttribute('value');
    };

    // elements

    public static getRelationEl = function(groupIndex, pickerIndex) {
        return element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .all(by.tagName('relation-picker')).get(pickerIndex);
    };

    public static getRelationSuggestionEl = function(groupIndex, pickerIndex, suggestionIndex) {
        return this.getRelationEl(groupIndex, pickerIndex).all(by.css('.suggestion')).get(suggestionIndex);
    };

    public static getRelationButtonEl = function(groupIndex, pickerIndex, relationIndex) {
        browser.wait(EC.visibilityOf(element(by.css('relation-picker-group relation-picker'))), delays.ECWaitTime);
        return this.getRelationEl(groupIndex, pickerIndex).all(by.tagName('button')).get(relationIndex);
    };

    public static getConflictModalFooter = function() {
        var footer = element(by.css('.conflict-modal-footer'));
        browser.wait(EC.visibilityOf(footer), delays.ECWaitTime);
        return footer;
    };

    // type in

    /**
     * @param text
     * @param inputFieldNr 0 for identifier,
     *   1 for shortDescription, 2 - n for other fields
     */
    public static typeInInputField = function(text, inputFieldNr?: number) {

        if (inputFieldNr == undefined) inputFieldNr = 0;

        // element-2, 0, 1 and 2 are type, id, geometries
        inputFieldNr += 3;

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + inputFieldNr + ' input'))),
            delays.ECWaitTime);
        common.typeIn(element(by.css('#edit-form-element-' + inputFieldNr + ' input')), text);
    };

    public static typeInRelationByIndices = function(groupIndex, pickerIndex, input) {
        common.typeIn(this.getRelationEl(groupIndex, pickerIndex)
            .element(by.tagName('input')), input);
    };
}