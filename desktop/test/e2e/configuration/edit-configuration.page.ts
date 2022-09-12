import { click, getElements, getText, selectOption, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class EditConfigurationPage {

    // click

    public static async clickSelectLanguage(inputIndex: number, languageCode: string) {

        const element = (await getElements('multi-language-input .language-select'))[inputIndex];
        return selectOption(element, languageCode);
    }


    public static async clickAddLanguage(inputIndex: number) {

        const element = (await getElements('multi-language-input .btn-success'))[inputIndex];
        return click(element);
    }


    public static async clickResetTranslation(inputIndex: number, translationIndex: number) {

        const inputElement = (await getElements('multi-language-input'))[inputIndex];
        const translationElement = (await inputElement.$$('.restore-button'))[translationIndex];
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

        const elements = await getElements('#field-editor-valuelist-section valuelist-view code');
        return getText(elements[index]);
    }


    // type in

    public static async typeInTranslation(inputIndex: number, translationIndex: number, text: string) {

        const inputElement = (await getElements('multi-language-input'))[inputIndex];
        const translationElement = (await inputElement.$$('.language-input input'))[translationIndex];
        return typeIn(translationElement, text);
    }


    public static typeInNewValue(valueId: string) {

        return typeIn('#new-value-input', valueId);
    }
}
