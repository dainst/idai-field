import { waitForExist, getElements, click, getElement, getText, selectOption } from '../app';


export class ImportPage {

    public static getSourceOptions() {

        return getElements('#importSourceSelect option');
    };


    public static async clickSourceOption(value: string) {

        return selectOption('#importSourceSelect', value)
    };


    public static async getSourceOptionValue(index) {

        const sourceOptionElements = await this.getSourceOptions();
        return sourceOptionElements[index].getAttribute('value');
    };


    public static async getOperationOptions() {

        await waitForExist('#operationSelect');
        return getElements('#operationSelect option');
    };


    public static getImportURLInput() {

        return getElement('#importUrlInput');
    };


    public static getMessageEl(index) {

        return getElement('#message-' + index);
    };


    public static async getMessageText(index) {

        return getText(await this.getMessageEl(index));
    };


    public static clickStartImportButton() {

        return click('#importStartButton');
    };


    public static getImportModal() {

        return getElement('#import-upload-modal');
    };
}
