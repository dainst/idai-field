import { click } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ConvertFieldDataModalPage {

    // click

    public static clickConvertAllSwitch() {

        return click('#convert-all-switch .switch');
    }


    public static clickConfirmConversionButton() {

        return click('#confirm-conversion-button');
    }
}
