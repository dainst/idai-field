import { click } from '../app';


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
}
