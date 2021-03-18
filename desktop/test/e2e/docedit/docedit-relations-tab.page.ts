import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from './docedit.page';

const common = require('../common.js');
const delays = require('../delays');
const EC = protractor.ExpectedConditions;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditRelationsTabPage {

    // click

    public static clickChooseRelationSuggestion(groupName, pickerIndex, suggestionIndex) {

        browser.wait(EC.visibilityOf(element.all(by.css('.suggestion')).get(suggestionIndex)),
            delays.ECWaitTime);
        common.click(element(by.id(groupName)).all(by.css('.suggestion')).get(suggestionIndex));
    };


    public static clickAddRelationForGroupWithIndex(groupName) {

        common.click(element(by.id(groupName)).element(by.css('.circular-button.add-relation')));
    };


    public static clickRelationDeleteButtonByIndices(groupName, pickerIndex = 0) {

        common.click(this.getRelationElByName(groupName, pickerIndex)
            .element(by.css('.delete-relation')));
    };


    // get text

    public static getRelationButtonText(groupName, pickerIndex = 0, relationIndex = 0) {

        DoceditPage.clickGotoTimeTab();
        return this.getRelationElByName(groupName, pickerIndex)
            .element(by.className('badge')).getText();
    };


    // elements

    public static getRelationElByName(groupName, pickerIndex) {

        return element(by.id(groupName)).all(by.id('relation-picker')).get(pickerIndex);
    };


    // type in

    public static typeInRelationByIndices(groupName, pickerIndex, input) {

        common.typeIn(element(by.id(groupName)).element(by.tagName('input')), input);
    };
}
