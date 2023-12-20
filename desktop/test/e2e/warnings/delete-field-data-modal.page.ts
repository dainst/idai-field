import { click, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DeleteFieldDataModalPage {

    // click

    public static async clickConfirmButton() {

        return click('#confirm-deletion-button');
    }


    public static async clickDeleteAllSwitch() {

        return click('#delete-all-switch label');
    }


    // Type

    public static async typeInConfirmFieldName(fieldName: string) {

        return typeIn('#confirm-field-name-input', fieldName);
    }
}
