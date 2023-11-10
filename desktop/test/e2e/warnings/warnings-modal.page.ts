import { click, getLocator, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class WarningsModalPage {

    // click

    public static async clickResource(identifier: string) {

        return click(await this.getResource(identifier));
    }


    public static async clickEditButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.edit-button'));
    }


    public static async clickDeleteFieldDataButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.delete-field-data-button'));
    }


    public static async clickCloseButton() {

        return click('#close-warnings-modal-button');
    }
    

    // get

    public static getModalBody() {

        return getLocator('.warnings-modal-body');
    }


    public static getResource(identifier: string) {

        return getLocator('#document-picker-resource-' + identifier);
    }


    public static async getSection(index: number) {

        return (await this.getSections()).nth(index);
    }


    public static getSections() {

        return getLocator('.warnings-section');
    }


    // get text

    public static async getSectionTitle(index: number) {

        const section = await this.getSection(index);
        return getText(await section.locator('.card-title'));
    }
}
