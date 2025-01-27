import { click, selectOption, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditDimensionEntryModalPage {

    // click

    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static async clickMeasurementPositionOption(optionValue: string) {

        return selectOption('.dimension-entry-modal-body .measurement-position-select', optionValue);
    }

    
    // type in

    public static async typeInInputValue(text: string) {

        return typeIn(('.dimension-entry-modal-body .value-input'), text);
    }
}
