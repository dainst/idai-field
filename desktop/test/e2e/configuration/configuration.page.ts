import { click, getElements, getElement, rightClick } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationPage {

    // click

    public static async selectCategoriesFilter(filterOption: string) {

        await click('#categories-filter .dropdown-toggle');
        return click('#categories-filter-selection-button-' + filterOption);
    };

    
     // get

     public static getCategories() {

        return getElements('.category-item');
    }


    public static getCategory(categoryName: string, supercategoryName?: string) {

        return getElement('#choose-category-option-'
            + (supercategoryName ? supercategoryName.toLowerCase() + '-' : '')
            + categoryName.toLowerCase());
    }


    // sequence

    public static async deleteCategory(categoryName: string, supercategoryName?: string) {

        await rightClick(await this.getCategory(categoryName, supercategoryName));
        await click('#context-menu-delete-button');
        return click('#delete-category-button');
    };


    public static async save() {

        await click('#save-button');
        return click('#confirm-button');
    }
}
