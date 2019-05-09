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

    public static clickChooseRelationSuggestion = function(groupName, pickerIndex, suggestionIndex) {

        browser.wait(EC.visibilityOf(element.all(by.css('.suggestion')).get(suggestionIndex)), delays.ECWaitTime);
        element(by.id(groupName)).all(by.css('.suggestion')).get(suggestionIndex).click();
    };


    public static clickAddRelationForGroupWithIndex = function(groupName) {

        element(by.id(groupName)).element(by.css('.circular-button.add-relation')).click();
    };


    public static clickRelationDeleteButtonByIndices = function(groupName, pickerIndex = 0) {

        return this.getRelationElByName(groupName, pickerIndex).element(by.css('.delete-relation')).click();
    };


    // get text

    public static getRelationButtonText = function(groupName, pickerIndex = 0, relationIndex = 0) {

        DoceditPage.clickGotoTimeTab();
        return this.getRelationElByName(groupName, pickerIndex)
            .element(by.className('badge')).getText();
    };


    // elements

    public static getRelationElByName = function(groupName, pickerIndex) {

        return element(by.id(groupName)).all(by.id('relation-picker')).get(pickerIndex);
    };


    // type in

    public static typeInRelationByIndices = function(groupName, pickerIndex, input) {

        common.typeIn(element(by.id(groupName)).element(by.tagName('input')), input);
    };
}