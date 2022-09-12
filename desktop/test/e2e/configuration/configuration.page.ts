import { click, getElement, getElements, getText, rightClick, typeIn, waitForNotExist } from '../app';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { EditConfigurationPage } from './edit-configuration.page';


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


    public static clickContextMenuEditOption() {

        return click('#context-menu-edit-button');
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


    public static async clickSelectField(fieldName: string) {

        return click(await this.getField(fieldName));
    }


    public static clickAddGroupButton() {

        return click('#add-group-button');
    }


    public static clickAddFieldButton() {

        return click('#add-field-button');
    }


    public static clickConfirmFieldDeletionButton() {

        return click('#delete-field-button');
    }

    
    // get

    public static getGroup(groupName: string) {

        return getElement('#group-' + groupName.replace(':', '-'));
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


    // get text

    public static async getValue(index: number) {

        const elements = await getElements('configuration-field valuelist-view code');
        return getText(elements[index]);
    }


    // type in

    public static typeInConfirmDeletionInput(text: string) {

        return typeIn('#delete-category-input', text);
    }


    // sequence

    public static async save() {

        await click('#save-button');
        await click('#confirm-button');
        await waitForNotExist('ngb-modal-backdrop');
    }


    public static async deleteCategory(categoryName: string, supercategoryName?: string,
                                       hasConfirmationInput: boolean = false) {

        await CategoryPickerPage.clickOpenContextMenu(categoryName, supercategoryName);
        await ConfigurationPage.clickContextMenuDeleteOption();
        if (hasConfirmationInput) await ConfigurationPage.typeInConfirmDeletionInput(categoryName);
        await ConfigurationPage.clickConfirmDeletionButton();
    }


    public static async changeMultiLanguageSetting(fieldName: string, categoryName: string,
                                                   supercategoryName?: string) {

        await ConfigurationPage.clickSelectCategoriesFilter('all');
        await CategoryPickerPage.clickSelectCategory(categoryName, supercategoryName);
        await ConfigurationPage.clickOpenContextMenuForField(fieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickToggleMultiLanguageSlider();
        await EditConfigurationPage.clickConfirm();
    }
}
