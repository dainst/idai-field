import { click, getLocator, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class AddCategoryFormModalPage {

    // click

    public static clickSelectForm(formName: string) {

        return click(this.getSelectFormButton(formName));
    }


    public static clickConfirmSelection() {

        return click('#confirm-category-form-selection-button');
    }


    public static clickCreateNewCategory() {

        return click('#new-category-button');
    }


    public static clickCancel() {

        return click('#cancel-add-category-modal-button');
    }


    public static clickConfirmSwappingCategoryForm() {

        return click('#confirm-swapping-button');
    }


    // get

    public static getCategoryHeader(categoryName: string) {

        return getLocator('#category-header-' + categoryName);
    }


    public static getSelectFormButton(formName: string) {

        return getLocator('#select-category-form-' + formName.replace(':', '-'));
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#category-name', text);
    }


    public static typeInConfirmSwappingCategoryFormInput(text: string) {

        return typeIn('#swap-category-form-input', text);
    }
}
