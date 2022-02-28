import { click, getElements, getElement } from '../app';


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


    public static getCategory(categoryName: string, supercategory?: string) {

        return getElement('#choose-category-option-'
            + (supercategory ? supercategory.toLowerCase() + '-' : '')
            + categoryName.toLowerCase());
    }
}
