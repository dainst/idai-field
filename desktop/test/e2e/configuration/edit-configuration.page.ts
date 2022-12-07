import { click, getLocator, getText, selectOption, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class EditConfigurationPage {

    // click

    public static async clickSelectLanguage(inputIndex: number, languageCode: string) {

        const element = (await getLocator('multi-language-input .language-select')).nth(inputIndex);
        return selectOption(element, languageCode);
    }


    public static async clickAddLanguage(inputIndex: number) {

        const element = (await getLocator('multi-language-input .btn-success')).nth(inputIndex);
        return click(element);
    }


    public static async clickResetTranslation(inputIndex: number, translationIndex: number) {

        const inputElement = (await getLocator('multi-language-input')).nth(inputIndex);
        const translationElement = (await inputElement.locator('.restore-button')).nth(translationIndex);
        return click(translationElement);
    }


    public static clickToggleHiddenSlider() {

        return click('#toggle-hidden-slider');
    }


    public static clickToggleMultiLanguageSlider() {

        return click('#toggle-multi-language-slider');
    }


    public static clickSwapValuelist() {

        return click('#swap-valuelist-button');
    }

    
    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static clickConfirmValuelist() {

        return click('#confirm-valuelist-button');
    }


    public static clickConfirmValue() {

        return click('#confirm-value-button');
    }


    public static clickAddValue() {

        return click('#add-value-button');
    }


    public static clickInputTypeSelectOption(optionValue: string) {

        return selectOption('#input-type-select', optionValue);
    }


    // get text

    public static getSelectedValuelist() {

        return getText('#valuelist-header code');
    }


    public static async getValue(index: number) {

        const elements = await getLocator('#field-editor-valuelist-section valuelist-view code');
        return getText(elements.nth(index));
    }


    // type in

    public static async typeInTranslation(inputIndex: number, translationIndex: number, text: string) {

        const inputElement = (await getLocator('multi-language-input')).nth(inputIndex);
        const translationElement = (await inputElement.locator('.language-input input')).nth(translationIndex);
        return typeIn(translationElement, text);
    }


    public static typeInNewValue(valueId: string) {

        return typeIn('#new-value-input', valueId);
    }
}
