import { click, getLocator, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class AddFieldModalPage {

    // click

    public static async clickSelectField(fieldName: string) {

        return click(await this.getSelectFieldButton(fieldName));
    }


    public static clickConfirmSelection() {

        return click('#confirm-selection-button');
    }


    public static async clickCreateNewField() {

        return click(await this.getCreateNewFieldButton());
    }


    public static clickCancel() {

        return click('#cancel-add-field-modal-button');
    }


    // get

    public static getSelectFieldButton(fieldName: string) {

        return getLocator('#select-field-' + fieldName);
    }


    public static getCreateNewFieldButton() {

        return getLocator('#new-field-button');
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#field-name', text);
    }
}
