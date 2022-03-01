import { click, getElements, getElement, rightClick, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationPage {

    // click

    public static async clickSelectCategoriesFilter(filterOption: string) {

        await click('#categories-filter .dropdown-toggle');
        return click('#categories-filter-selection-button-' + filterOption);
    };


    public static async save() {

        await click('#save-button');
        return click('#confirm-button');
    }


    public static async clickOpenContextMenuForCategory(categoryName: string, supercategoryName?: string) {

        await rightClick(await this.getCategory(categoryName, supercategoryName));
    }


    public static clickContextMenuDeleteOption() {

        return click('#context-menu-delete-button');
    };


    public static clickConfirmDeletionButton() {

        return click('#delete-category-button');
    }

    
     // get

     public static getCategories() {

        return getElements('.category-item');
    }


    public static getCategory(categoryName: string, supercategoryName?: string) {

        return getElement('#choose-category-option-'
            + (supercategoryName ? supercategoryName.toLowerCase() + '-' : '')
            + categoryName.toLowerCase());
    }


    // type in

    public static typeInConfirmDeletionInput(text: string) {

        return typeIn('#delete-category-input', text);
    }


    // sequence

    public static async deleteCategory(categoryName: string, supercategoryName?: string,
                                       hasConfirmationInput: boolean = false) {

        await ConfigurationPage.clickOpenContextMenuForCategory(categoryName, supercategoryName);
        await ConfigurationPage.clickContextMenuDeleteOption();
        if (hasConfirmationInput) await ConfigurationPage.typeInConfirmDeletionInput(categoryName);
        await ConfigurationPage.clickConfirmDeletionButton();
    }
}
