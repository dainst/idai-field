import { click, selectOption, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditMeasurementEntryModalPage {

    // click

    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static async clickMeasurementPositionOption(optionValue: string) {

        return selectOption('.measurement-entry-modal-body .measurement-position-select', optionValue);
    }

    
    // type in

    public static async typeInInputValue(text: string) {

        return typeIn(('.measurement-entry-modal-body .value-input'), text);
    }
}
