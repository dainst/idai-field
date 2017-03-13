import {browser,protractor,element,by} from 'protractor';

let common = require("../common.js");
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
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

    public static clickRelationsTab = function() {
        element(by.id('document-edit-relations-tab')).click();
    };

    public static clickFieldsTab = function() {
        element(by.id('document-edit-fields-tab')).click();
    };

    public static clickSaveDocument = function() {
        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-save-document'))), delays.ECWaitTime)
            .then(function(){
                element(by.id('document-edit-button-save-document')).click().then(
                    function() {
                        return new Promise(function(resolve){
                            setTimeout(function(){
                                resolve();
                            },delays.shortRest);
                        })
                    }
                )
            })
    };

    // get text

    public static getRelationButtonText = function(groupIndex, pickerIndex, relationIndex) {
        this.clickRelationsTab();
        return this.getRelationButtonEl(groupIndex, pickerIndex, relationIndex).element(by.tagName('span')).getText();
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

    // type in

    public static typeInIdentifier = function(identifier) {
        // element-2, 0,1 and 2 are type, id, geometries
        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-3 input'))), delays.ECWaitTime);
        common.typeIn(element(by.css('#edit-form-element-3 input')), identifier);
    };

    public static typeInRelationByIndices = function(groupIndex, pickerIndex, input) {
        common.typeIn(this.getRelationEl(groupIndex, pickerIndex)
            .element(by.tagName('input')), input);
    };
}