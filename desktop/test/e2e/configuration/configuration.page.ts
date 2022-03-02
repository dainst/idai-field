import { CategoryPickerPage } from '../widgets/category-picker.page';
import { click, getElement, getElements, rightClick, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConfigurationPage {

    // click

    public static async clickSelectCategoriesFilter(filterOption: string) {

        await click('#categories-filter .dropdown-toggle');
        return click('#categories-filter-selection-button-' + filterOption);
    };


    public static async clickOpenContextMenuForField(fieldName: string) {

        return rightClick(await this.getField(fieldName));
    }


    public static clickContextMenuSwapOption() {

        return click('#context-menu-swap-button');
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


    public static async clickSelectGroup(groupName: string) {

        return click(await this.getGroup(groupName));
    }


    public static clickAddFieldButton() {

        return click('#add-field-button');
    }


    public static clickConfirmFieldDeletionButton() {

        return click('#delete-field-button');
    }

    
    // get

    public static getGroup(groupName: string) {

        return getElement('#group-' + groupName);
    }


    public static getFields() {

        return getElements('configuration-field');
    }

    
    public static getField(fieldName: string) {

        return getElement('#field-' + fieldName.replace(':', '-'));
    }


    public static getCategory(categoryName: string) {

        return getElement('#category-' + categoryName.replace(':', '-'));
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
