import { click, getLocator, getText, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DeleteFieldModalPage {

    // click

    public static clickConfirm() {

        return click('#delete-field-button');
    }


    public static clickCancel() {

        return click('#cancel-field-deletion-button');
    }


    // text

    public static getModalText() {

        return getText(getLocator('.configuration-delete-modal-body'));
    }
}
