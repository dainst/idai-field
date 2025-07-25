import { click, getLocator, getText, selectSearchableSelectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class FixOutliersModalPage {

    // click

    public static async clickSelectValue(valueLabel: string) {

        return selectSearchableSelectOption('#fix-outliers-modal-body searchable-select', valueLabel);
    }


    public static async clickCheckboxesValue(checkboxIndex: number) {

        const element = await (await getLocator('.checkbox')).nth(checkboxIndex);
        
        return click(element);
    }


    public static clickMultipleSwitch() {

        return click('#multiple-switch .switch');
    }


    public static clickConfirmReplacementButton() {

        return click('#confirm-replacement-button');
    }


    public static clickCancelButton() {

        return click('#cancel-button');
    }

    
    // get

    public static async getHeading() {

        return getText('#fix-outliers-modal-header h5');
    }

    
    public static getMultipleSwitch() {

        return getLocator('#multiple-switch .switch');
    }
}
