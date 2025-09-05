import { click, getLocator, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ProcessListPage {

    // click

    public static async clickToggleSortByIdentifier() {

        await click('.processes-headings .process-identifier');
    }


    public static async clickToggleSortByDate() {

        await click('.processes-headings .process-date');
    }


    // get

    public static async getProcess(index: number) {

        return (await this.getProcesses()).nth(index);
    }


    public static async getProcesses() {

        return await getLocator('.process-item');
    }


    // text

    public static async getProcessIdentifier(index: number) {

        const element = await this.getProcess(index);

        return getText(element.locator('.process-identifier'));
    }
}
