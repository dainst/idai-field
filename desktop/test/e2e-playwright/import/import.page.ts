import { waitForExist, getLocator, click, getText, selectOption } from '../app';


export class ImportPage {

    public static getSourceOptions() {

        return getLocator('#importSourceSelect option');
    };


    public static async clickSourceOption(value: string) {

        return selectOption('#importSourceSelect', value);
    };


    public static async getSourceOptionValue(index) {

        const sourceOptionElements = await this.getSourceOptions();
        return sourceOptionElements.nth(index).getAttribute('value');
    };


    public static async getOperationOptions() {

        await waitForExist('#operationSelect');
        return getLocator('#operationSelect option');
    };


    public static getImportURLInput() {

        return getLocator('#importUrlInput');
    };


    public static getMessageEl(index) {

        return getLocator('#message-' + index);
    };


    public static async getMessageText(index) {

        return getText(await this.getMessageEl(index));
    };


    public static clickStartImportButton() {

        return click('#importStartButton');
    };


    public static getImportModal() {

        return getLocator('#import-upload-modal');
    };
}
