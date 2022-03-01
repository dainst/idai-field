import { click, getElements, selectOption, typeIn } from '../app';


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

    
    public static clickConfirm() {

        return click('#confirm-button');
    }


    // type in

    public static async typeInTranslation(inputIndex: number, translationIndex: number, text: string) {

        const inputElement = (await getElements('multi-language-input'))[inputIndex];
        const translationElement = (await inputElement.$$('.language-input input'))[translationIndex];
        return typeIn(translationElement, text);
    }
}
