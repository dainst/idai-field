import { click, getLocator, getText, getValue, typeIn, waitForExist } from '../app';


export type SearchBarContext = 'resources'|'images'|'modal';


/**
 * @author Thomas Kleinke
 */
export class SearchBarPage {

    // text

    public static async getSearchBarInputFieldValue() {

        const inputField = await SearchBarPage.getSearchBarInputField();
        return getValue(inputField);
    }


    public static async getSelectedCategoryFilterCharacter(context: SearchBarContext = 'resources') {

        const element = await SearchBarPage.getSelectedCategoryFilterButton(context);
        await waitForExist(element);
        return getText(await element.locator('.character'));
    }


    // click

    public static async clickChooseCategoryFilter(categoryName: string, context: SearchBarContext = 'resources') {

        await this.clickCategoryFilterButton(context);
        await click('#choose-category-option-' + categoryName);
        return this.clickCategoryFilterButton(context);
    }


    public static async clickCategoryFilterButton(context: SearchBarContext = 'resources') {

        return click(await this.getFilterButton(context));
    }


    public static async clickSearchBarInputField() {

        return click(await SearchBarPage.getSearchBarInputField());
    }


    // type in

    public static async typeInSearchField(text) {

        return typeIn(await SearchBarPage.getSearchBarInputField(), text);
    }


    // elements

    private static getFilterButton(context: SearchBarContext) {

        const prefix: string = context !== 'modal' ? context + '-search-bar-' : '';
        return getLocator('#' + prefix + 'filter-button');
    }


    private static async getSelectedCategoryFilterButton(context: SearchBarContext) {

        const filterButtonElement = await this.getFilterButton(context);
        return filterButtonElement.locator('category-icon');
    }


    private static getSearchBarInputField() {

        return getLocator('.search-bar-input');
    }


    public static async getCategoryFilterOptionLabels() {

        await waitForExist('.category-picker');
        return getLocator('.category-label');
    }
}
