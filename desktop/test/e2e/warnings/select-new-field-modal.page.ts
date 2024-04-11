import { click, selectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class SelectNewFieldModalPage {

    // click

    public static clickMultipleSwitch() {

        return click('#multiple-switch .switch');
    }


    public static clickSelectField(value: string) {

        return selectOption('#new-field-select', value);
    }


    public static clickConfirmButton() {

        return click('#confirm-button');
    }
}
