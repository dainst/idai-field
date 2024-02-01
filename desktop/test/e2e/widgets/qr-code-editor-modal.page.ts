import { click, getLocator } from '../app';


/**
 * @author Thomas Kleinke
 */
export class QrCodeEditorModalPage {

    // click

    public static clickAddQrCode() {

        return click('#add-qr-code-button');
    }


    public static clickGenerateQrCode() {

        return click('#generate-qr-code-button');
    }


    public static clickSetExistingQrCode() {

        return click('#set-existing-qr-code-button');
    }


    public static clickCancel() {

        return click('#qr-code-editor-cancel-button');
    }


    // get

    public static getPlaceholder() {

        return getLocator('#qr-code-placeholder');
    }

    
    public static getCanvas() {

        return getLocator('#qr-code-canvas');
    }
}
