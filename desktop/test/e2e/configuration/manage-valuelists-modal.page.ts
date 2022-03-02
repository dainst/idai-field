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


    // get

    public static getSelectValuelistButton(valuelistName: string) {

        return getElement('#valuelist-' + valuelistName);
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#valuelist-search-input', text);
    }
}
