import { click, getLocator, getSearchableSelectOption, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditCompositeEntryModalPage {

    // click

    public static async clickCancel() {

        return click('#cancel-button');
    }


    public static async selectSubfieldSelectOption(fieldIndex: number, optionValueLabel: string) {

        return click(await this.getSubfieldSelectOption(fieldIndex, optionValueLabel));
    }


    // get text

    public static async getSubfieldLabel(fieldIndex: number) {

        const element = await getLocator('.subfield-section').nth(fieldIndex);
        return getText(await element.locator('.composite-entry-modal-subfield-label'));
    }

    
    // elements

    public static async getSubfieldInputElement(fieldIndex: number, inputType: string) {

        const element = await getLocator('.subfield-section').nth(fieldIndex);
        return element.locator('form-field-' + inputType);
    }


    public static async getSubfieldSelectOption(fieldIndex: number, optionValueLabel: string) {

        const element = await getLocator('.subfield-section').nth(fieldIndex);
        return getSearchableSelectOption(element, optionValueLabel);
    }
}
