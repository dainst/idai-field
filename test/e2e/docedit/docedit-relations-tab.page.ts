import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from "./docedit.page";

let common = require('../common.js');
let delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditRelationsTabPage {

    // click

    public static clickChooseRelationSuggestion = function(groupIndex, pickerIndex, suggestionIndex) {

        browser.wait(EC.visibilityOf(element.all(by.css('.suggestion')).get(suggestionIndex)), delays.ECWaitTime);
        this.getRelationEl(groupIndex, pickerIndex)
            .all(by.css('.suggestion')).get(suggestionIndex).click();
    };

    public static clickAddRelationForGroupWithIndex = function(groupIndex) {

        element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .element(by.css('.circular-button.add-relation')).click();
    };

    public static clickRelationDeleteButtonByIndices = function(groupIndex, pickerIndex, suggestionIndex) {

        return this.getRelationEl(groupIndex, pickerIndex).all(by.css('.delete-relation')).get(suggestionIndex)
            .click();
    };

    // get text

    public static getRelationButtonText = function(groupIndex, pickerIndex, relationIndex) {

        DoceditPage.clickRelationsTab();
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

    public static typeInRelationByIndices = function(groupIndex, pickerIndex, input) {

        common.typeIn(this.getRelationEl(groupIndex, pickerIndex)
            .element(by.tagName('input')), input);
    };
}