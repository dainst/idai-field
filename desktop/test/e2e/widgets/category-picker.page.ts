import { click, getLocator, getText, rightClick } from '../app';


/**
 * @author Thomas Kleinke
 */
export class CategoryPickerPage {

    // click

    public static async clickSelectCategory(categoryName: string, supercategoryName?: string, containerId?: string) {

        await click(await this.getCategory(categoryName, supercategoryName, containerId));
    }


    public static async clickOpenContextMenu(categoryName: string, supercategoryName?: string, containerId?: string) {

        await rightClick(await this.getCategory(categoryName, supercategoryName, containerId));
    }


    // get

    public static getCategories() {

        return getLocator('.category-item');
    }
    

    public static getCategory(categoryName: string, supercategoryName?: string, containerId?: string) {

        const prefix: string = containerId ? '#' + containerId + ' ' : '';
        return getLocator(prefix + '#choose-category-option-'
            + (supercategoryName ? supercategoryName.replace(':', '-').toLowerCase() + '-' : '')
            + categoryName.replace(':', '-').toLowerCase());
    }


    // text

    public static async getCategoryLabel(categoryName: string, supercategoryName?: string, containerId?: string) {

        const element = await (await this.getCategory(categoryName, supercategoryName, containerId))
            .locator('.category-label');

        return getText(element);
    }
}
