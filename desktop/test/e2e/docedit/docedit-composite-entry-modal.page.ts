import { click, getLocator, getSearchableSelectOption, getText, waitForExist } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditCompositeEntryModalPage {

    // click

    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static clickCancel() {

        return click('#cancel-button');
    }


    public static async clickSelectSubfieldSelectOption(fieldIndex: number, optionValueLabel: string) {

        return click(await this.getSubfieldSelectOption(fieldIndex, optionValueLabel));
    }


    public static async clickSubfieldBooleanRadioButton(fieldIndex: number, radioButtonIndex: number) {

        const inputElement = await this.getSubfieldInputElement(fieldIndex, 'boolean');
        await waitForExist(inputElement);
        const radioButtonElement = await (await inputElement.locator('input')).nth(radioButtonIndex);
        return click(radioButtonElement);
    }


    public static async clickRemoveOutlierValue(fieldIndex: number, outlierValueIndex: number) {

        const outlierValues = await this.getOutlierValues(fieldIndex);
        const valueToRemove = await outlierValues.nth(outlierValueIndex);
        return click(valueToRemove.locator('.remove-outlier-button'));
    }


    // get text

    public static async getSubfieldLabel(fieldIndex: number) {

        const element = await getLocator('.docedit-subfield-section').nth(fieldIndex);
        return getText(await element.locator('.composite-entry-modal-subfield-label'));
    }

    
    // elements

    public static async getSubfieldInputElement(fieldIndex: number, inputType: string) {

        const element = await getLocator('.docedit-subfield-section').nth(fieldIndex);
        return element.locator('form-field-' + inputType);
    }


    public static async getSubfieldSelectOption(fieldIndex: number, optionValueLabel: string) {

        const element = await getLocator('.docedit-subfield-section').nth(fieldIndex);
        return getSearchableSelectOption(element, optionValueLabel);
    }


    public static async getOutlierValues(fieldIndex: number) {

        const element = await getLocator('.docedit-subfield-section').nth(fieldIndex);
        return element.locator('.outlier');
    }
}
