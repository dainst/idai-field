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


    public static clickCreateNewField() {

        return click('.new-entry-button');
    }


    // get

    public static getSelectFieldButton(fieldName: string) {

        return getLocator('#select-field-' + fieldName);
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#field-name', text);
    }
}
