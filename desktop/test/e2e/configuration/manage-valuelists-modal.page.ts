import { click, getElement, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ManageValuelistsModalPage {

    // click

    public static async clickSelectValuelist(fieldName: string) {

        return click(await this.getSelectValuelistButton(fieldName));
    }


    public static clickConfirmSelection() {

        return click('#confirm-selection-button');
    }


    public static clickCreateNewValuelist() {

        return click('.new-entry-button');
    }


    public static clickFilterButton() {

        return click('#valuelist-filter-button');
    }


    public static clickToggleCustomFilter() {

        return click('#custom-filter');
    }


    public static clickToggleInUseFilter() {

        return click('#in-use-filter');
    }


    public static clickCancel() {

        return click('#cancel-manage-valuelists-modal-button');
    }


    // get

    public static getSelectValuelistButton(valuelistId: string) {

        return getElement('#valuelist-' + valuelistId.replace(':', '-'));
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#valuelist-search-input', text);
    }
}
