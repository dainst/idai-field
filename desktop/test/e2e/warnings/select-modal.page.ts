import { click, getLocator, selectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class SelectModalPage {

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


    public static clickCancelButton() {

        return click('#cancel-button');
    }


    // get
    
    public static getMultipleSwitch() {

        return getLocator('#multiple-switch .switch');
    }
}
