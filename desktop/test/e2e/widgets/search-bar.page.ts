import {browser, protractor, element, by} from 'protractor';

const EC = protractor.ExpectedConditions;
const common = require('../common.js');
const delays = require('../delays');

export type SearchBarContext = 'resources'|'images'|'modal';


/**
 * @author Thomas Kleinke
 */
export class SearchBarPage {

    // text

    public static getSearchBarInputFieldValue() {

        return SearchBarPage.getSearchBarInputField().getAttribute('value');
    }


    public static getSelectedCategoryFilterCharacter(context: SearchBarContext = 'resources') {

        browser.wait(EC.presenceOf(SearchBarPage.getSelectedCategoryFilterButton(context)), delays.ECWaitTime);
        return SearchBarPage.getSelectedCategoryFilterButton(context).element(by.css('.character')).getText();
    }


    public static getCategoryFilterOptionLabels() {

        browser.wait(EC.presenceOf(element(by.css('.category-picker'))), delays.ECWaitTime);
        return element.all(by.css('.category-label'));
    }


    // click

    public static clickChooseCategoryFilter(categoryName: string, context: SearchBarContext = 'resources') {

        this.clickCategoryFilterButton(context);
        common.click(element(by.id('choose-category-option-' + categoryName)));
        this.clickCategoryFilterButton(context);
    }


    public static clickCategoryFilterButton(context: SearchBarContext = 'resources') {

        common.click(this.getFilterButton(context).element(by.css('.search-filter')));
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

        const prefix: string = context !== 'modal' ? context + '-search-bar-' : '';
        return element(by.id(prefix + 'filter-button'));
    }


    private static getSelectedCategoryFilterButton(context: SearchBarContext) {

        return this.getFilterButton(context).element(by.css('category-icon'));
    }


    private static getSearchBarInputField() {

        return element(by.css('.search-bar-input'));
    }
}
