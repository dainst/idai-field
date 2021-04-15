import { waitForExist, getElements, click, getElement, getText } from '../app';


export class ImportPage {

    public static getSourceOptions() {

        return getElements('#importSourceSelect option');
    };


    public static async clickSourceOption(index) {

        const sourceOptionElements = await this.getSourceOptions();
        return click(sourceOptionElements[index]);
    };


    public static async getSourceOptionValue(index) {

        const sourceOptionElements = await this.getSourceOptions();
        return sourceOptionElements[index].getAttribute('value');
    };


    public static async getOperationOptions() {

        await waitForExist('#operationSelect');
        return getElements('#operationSelect option');
    };


    public static async clickOperationOption(index) {

        const operationOptionElements = await this.getOperationOptions();
        return click(operationOptionElements[index]);
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
