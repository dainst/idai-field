import { CategoryPickerPage } from '../widgets/category-picker.page';
import { click, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationPage {

    // click

    public static async clickSelectCategoriesFilter(filterOption: string) {

        await click('#categories-filter .dropdown-toggle');
        return click('#categories-filter-selection-button-' + filterOption);
    };


    public static clickContextMenuDeleteOption() {

        return click('#context-menu-delete-button');
    };


    public static clickConfirmDeletionButton() {

        return click('#delete-category-button');
    }

    
    public static clickCreateSubcategory(parentCategoryName: string) {

        return click('#create-subcategory-' + parentCategoryName);
    }


    // type in

    public static typeInConfirmDeletionInput(text: string) {

        return typeIn('#delete-category-input', text);
    }


    // sequence


    public static async save() {

        await click('#save-button');
        return click('#confirm-button');
    }


    public static async deleteCategory(categoryName: string, supercategoryName?: string,
                                       hasConfirmationInput: boolean = false) {

        await CategoryPickerPage.clickOpenContextMenu(categoryName, supercategoryName);
        await ConfigurationPage.clickContextMenuDeleteOption();
        if (hasConfirmationInput) await ConfigurationPage.typeInConfirmDeletionInput(categoryName);
        await ConfigurationPage.clickConfirmDeletionButton();
    }
}
