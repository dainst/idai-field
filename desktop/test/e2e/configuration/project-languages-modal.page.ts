import { click } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ProjectLanguagesModalPage {

    // click

    public static clickDeleteLanguage(languageCode: string) {

        return click('.project-languages-modal-body #language-item-' + languageCode + ' .remove-language');
    }


    public static clickConfirm() {

        return click('#confirm-project-languages-button');
    }
}
