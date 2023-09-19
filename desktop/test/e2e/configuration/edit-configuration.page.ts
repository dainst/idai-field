import { click, getLocator, getText, selectOption, typeIn, waitForExist } from '../app';


type ModalContext = 'field'|'subfield'|'value'|'group'|'category';


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


    public static clickAddValuelist() {

        return click('#add-valuelist-button');
    }


    public static clickSwapValuelist() {

        return click('#swap-valuelist-button');
    }


    public static clickEditValuelist() {

        return click('#edit-valuelist-button');
    }

    
    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static clickCancel() {

        return click('#cancel-button');
    }


    public static clickConfirmValuelist() {

        return click('#confirm-valuelist-button');
    }


    public static clickConfirmValue() {

        return click('#confirm-value-button');
    }


    public static clickConfirmSubfield() {

        return click('#confirm-subfield-button');
    }


    public static clickAddValue() {

        return click('#add-value-button');
    }


    public static clickCreateSubfield() {

        return click('#create-subfield-button');
    }


    public static async clickEditSubfield(subfieldIndex: number) {

        const subfieldElement = await getLocator('.subfield-container').nth(subfieldIndex);
        return click(await subfieldElement.locator('.edit-subfield-button'));
    }


    public static clickInputTypeSelectOption(optionValue: string, modalContext: ModalContext) {

        return selectOption(this.getModalClass(modalContext) + ' .input-type-select', optionValue);
    }


    public static async clickSelectConditionSubfield(subfieldName: string) {

        const element = (await getLocator('#condition-subfield-select'));
        return selectOption(element, subfieldName);
    }


    public static async clickSelectConditionValue(type: 'boolean'|'valuelist', valueIndex: number) {

        const elementId = '#' + (
            type === 'boolean' ? 'boolean-condition-radio-buttons' : 'valuelist-condition-checkboxes'
        );
        await waitForExist(elementId);
        const element = (await getLocator(elementId + ' input')).nth(valueIndex);
        return click(element);
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

    public static async typeInTranslation(inputIndex: number, translationIndex: number, text: string,
                                          modalContext: ModalContext) {

        const inputElement = (await getLocator(this.getModalClass(modalContext) + ' multi-language-input'))
            .nth(inputIndex);
        const translationElement = (await inputElement.locator('.language-input input')).nth(translationIndex);
        return typeIn(translationElement, text);
    }


    public static async typeInIdentifierPrefix(prefix: string) {

        return typeIn('#identifier-prefix', prefix);
    }


    public static typeInNewValue(valueId: string) {

        return typeIn('#new-value-input', valueId);
    }


    public static typeInNewSubfield(subfieldName: string) {

        return typeIn('#new-subfield-input', subfieldName);
    }


    private static getModalClass(modalContext: ModalContext = 'field') {

        return '.' +  modalContext + '-editor-modal-body';
    }
}
