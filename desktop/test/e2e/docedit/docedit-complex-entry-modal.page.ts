import { click, getLocator, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditComplexEntryModalPage {

    // click

    public static async clickCancel() {

        return click('#cancel-button');
    }


    // get text

    public static async getSubfieldLabel(fieldIndex: number) {

        const element = await getLocator('.subfield-section').nth(fieldIndex);
        return getText(await element.locator('.complex-entry-modal-subfield-label'));
    }

    
    // elements

    public static async getSubfieldInputElement(fieldIndex: number, inputType: string) {

        const element = await getLocator('.subfield-section').nth(fieldIndex);
        return element.locator('form-field-' + inputType);
    }
}
