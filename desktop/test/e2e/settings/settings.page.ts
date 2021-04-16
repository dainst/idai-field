import { click, getElement } from '../app';


/**
 * @author Thomas Kleinke
 */
export class SettingsPage {

    public static clickSaveSettingsButton() {

        return click('#save-settings-button');
    };


    public static getImagestorePathInput() {

        return getElement('#imagestorepath-input');
    };
}
