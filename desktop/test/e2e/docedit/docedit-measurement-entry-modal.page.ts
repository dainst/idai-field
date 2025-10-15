import { click, selectSearchableSelectOption, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditMeasurementEntryModalPage {

    // click

    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static async clickMeasurementPositionOption(optionLabel: string) {

        return selectSearchableSelectOption(
            '.measurement-entry-modal-body .measurement-position-select searchable-select',
            optionLabel
        );
    }

    
    // type in

    public static async typeInInputValue(text: string) {

        return typeIn(('.measurement-entry-modal-body .value-input'), text);
    }
}
