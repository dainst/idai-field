import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from "./docedit.page";

const common = require('../common.js');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

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


    public static clickRelationDeleteButtonByIndices = function(groupIndex, pickerIndex = 0) {

        return this.getRelationEl(groupIndex, pickerIndex).element(by.css('.delete-relation')).click();
    };


    // get text

    public static getRelationButtonText = function(groupName, pickerIndex = 0, relationIndex = 0) {

        DoceditPage.clickGotoTimeTab();
        return this.getRelationElByName(groupName, pickerIndex, relationIndex)
            .element(by.className('badge')).getText();
    };


    // elements

    public static getRelationEl = function(groupIndex, pickerIndex) {

        return element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .all(by.tagName('relation-picker')).get(pickerIndex);
    };


    public static getRelationElByName = function(groupName, pickerIndex) {

        return element(by.id(groupName)).all(by.id('relation-picker')).get(pickerIndex);
    };


    // type in

    public static typeInRelationByIndices = function(groupIndex, pickerIndex, input) {

        common.typeIn(this.getRelationEl(groupIndex, pickerIndex)
            .element(by.tagName('input')), input);
    };
}