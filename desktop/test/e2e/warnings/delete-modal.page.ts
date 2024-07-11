import { click, getLocator, getText, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DeleteModalPage {

    // click

    public static async clickConfirmButton() {

        return click('#confirm-deletion-button');
    }


    public static async clickMultipleSwitch() {

        return click('#multiple-switch label');
    }


    public static clickCancelButton() {

        return click('#cancel-button');
    }


    // Type

    public static async typeInConfirmValue(fieldName: string) {

        return typeIn('#confirm-deletion-input', fieldName);
    }


    // get

    public static async getHeading(modalName: string) {

        return getText('#' + modalName + '-modal-header h5');
    }
    

    public static getMultipleSwitch() {

        return getLocator('#multiple-switch .switch');
    }
}
