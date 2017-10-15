import {browser, protractor, element, by} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Thomas Kleinke
 */
export class SearchBarPage {

    // elements

    public static getSelectedTypeFilterButton() {

        return element(by.css('#filter-button type-icon'));
    };


    public static getSearchBarInputField() {

        return element(by.id('object-search'));
    };


    // text

    public static getSearchBarInputFieldValue() {

        return SearchBarPage.getSearchBarInputField().getAttribute('value');
    };


    public static getSelectedTypeFilterCharacter() {

        browser.wait(EC.presenceOf(SearchBarPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        return SearchBarPage.getSelectedTypeFilterButton().element(by.css('.character')).getText();
    }


    // click

    public static clickChooseTypeFilter(typeName) {

        common.click(element(by.id('searchfilter')));
        common.click(element(by.id('choose-type-option-' + typeName)));
    };


    // type in

    public static typeInSearchField(text) {

        return common.typeIn(SearchBarPage.getSearchBarInputField(), text);
    };
}