import {browser, protractor, element, by} from 'protractor';

const EC = protractor.ExpectedConditions;
const common = require('../common.js');
const delays = require('../config/delays');

export type SearchBarContext = 'resources'|'images'|undefined;


/**
 * @author Thomas Kleinke
 */
export class SearchBarPage {

    // text

    public static getSearchBarInputFieldValue() {

        return SearchBarPage.getSearchBarInputField().getAttribute('value');
    }


    public static getSelectedTypeFilterCharacter(context: SearchBarContext = 'resources') {

        browser.wait(EC.presenceOf(SearchBarPage.getSelectedTypeFilterButton(context)), delays.ECWaitTime);
        return SearchBarPage.getSelectedTypeFilterButton(context).element(by.css('.character')).getText();
    }


    // click

    public static clickChooseTypeFilter(typeName: string, context: SearchBarContext = 'resources') {

        common.click(this.getFilterButton(context).element(by.css('.search-filter')));
        common.click(element(by.id('choose-type-option-' + typeName)));
    }


    public static clickSearchBarInputField() {

        return common.click(SearchBarPage.getSearchBarInputField());
    }


    // type in

    public static typeInSearchField(text) {

        return common.typeIn(SearchBarPage.getSearchBarInputField(), text);
    }


    // elements

    private static getFilterButton(context: SearchBarContext) {

        const prefix: string = context ? context + '-search-bar-' : '';
        return element(by.id(prefix + 'filter-button'));
    }


    private static getSelectedTypeFilterButton(context: SearchBarContext) {

        return this.getFilterButton(context).element(by.css('type-icon'));
    }


    private static getSearchBarInputField() {

        return element(by.css('.search-bar-input'));
    }
}