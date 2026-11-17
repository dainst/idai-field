import { click, getLocator } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConvertFieldDataModalPage {

    // click

    public static clickMultipleSwitch() {

        return click('#multiple-switch .switch');
    }


    public static clickConfirmConversionButton() {

        return click('#confirm-conversion-button');
    }


    public static clickCancelButton() {

        return click('#cancel-button');
    }


    // get

    public static getMultipleSwitch() {

        return getLocator('#multiple-switch .switch');
    }
}
