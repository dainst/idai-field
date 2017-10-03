import {browser, protractor, element, by} from 'protractor';

let common = require('../common.js');
let delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditPage {

    public static clickChooseRelationSuggestion = function(groupIndex, pickerIndex, suggestionIndex) {

        browser.wait(EC.visibilityOf(element.all(by.css('.suggestion')).get(suggestionIndex)), delays.ECWaitTime);
        this.getRelationEl(groupIndex, pickerIndex)
            .all(by.css('.suggestion')).get(suggestionIndex).click();
    };

     public static clickCloseEdit() {

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

    public static clickInsertImage = function() {

        common.click(element(by.id('create-depicts-relations-btn')));
    };

    public static clickFieldsTab = function() {

        common.click(element(by.id('docedit-fields-tab')));
    };

    public static clickRelationsTab = function() {

        common.click(element(by.id('docedit-relations-tab')));
    };

    public static clickImagesTab = function() {

        common.click(element(by.id('docedit-images-tab')));
    };

    public static clickConflictsTab = function() {

        common.click(element(by.id('docedit-conflicts-tab')));
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

    public static clickDeleteImages() {

        common.click(element(by.id('delete-images')));
    }

    public static clickDeleteDocument() {

        common.click(element(by.id('document-edit-button-delete-document')));
    };

    public static clickConfirmDeleteInModal = function() {

        common.click(element(by.id('delete-resource-confirm')));
    };

    public static clickChooseRightRevision = function() {

        browser.wait(EC.visibilityOf(element.all(by.css('input[type=radio]')).get(1)), delays.ECWaitTime);
        element.all(by.css('input[type=radio]')).get(1).click();
    };

    public static clickSolveConflictButton = function() {

        browser.wait(EC.visibilityOf(element(by.id('solve-conflict-button'))), delays.ECWaitTime);
        element(by.id('solve-conflict-button')).click();
    };

    public static clickTypeSwitcherButton = function() {

        browser.wait(EC.visibilityOf(element(by.id('type-switcher-button'))), delays.ECWaitTime);
        element(by.id('type-switcher-button')).click();
    };

    public static clickTypeSwitcherOption = function(typeName: string) {

        browser.wait(EC.visibilityOf(element(by.id('choose-type-option-' + typeName))), delays.ECWaitTime);
        element(by.id('choose-type-option-' + typeName)).click();
    };

    public static clickSelectOption(inputFieldNr, optionIndex) {

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + inputFieldNr + ' select'))),
            delays.ECWaitTime);
        element.all(by.css('#edit-form-element-' + inputFieldNr + ' select option')).get(optionIndex).click();
    };

    // get text

    public static getRelationButtonText = function(groupIndex, pickerIndex, relationIndex) {

        this.clickRelationsTab();
        return this.getRelationButtonEl(groupIndex, pickerIndex, relationIndex).element(by.tagName('span')).getText();
    };

    public static getInputFieldValue = function(index) {

        browser.wait(EC.visibilityOf(element.all(by.tagName('dai-input input')).get(index)), delays.ECWaitTime);
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

    public static getConfirmDeletionInputField() {

        return element(by.id('delete-resource-input'));
    }

    public static getCells() {

        return element.all(by.css('.cell'));
    }

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

    public static typeInIdentifierInConfirmDeletionInputField(identifier) {

        return common.typeIn(this.getConfirmDeletionInputField(), identifier);
    }
}