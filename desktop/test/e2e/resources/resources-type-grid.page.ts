import { click, getLocator, rightClick, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ResourcesTypeGridPage {

    // click

    public static async clickGridElement(identifier: string) {

        return click(await this.getGridElement(identifier));
    }


    public static clickEditButton() {

        return click('.edit-button');
    }


    public static clickTypeCatalogsNavigationButton() {

        return click('#types-navigation-root');
    }


    public static async clickOpenContextMenu(identifier: string) {

        return rightClick(await this.getGridElement(identifier));
    }


    public static clickToggleFindsSectionButton() {

        return click('#toggle-finds-section-button');
    }


    // elements

    public static getLinkedDocumentsGrid() {

        return getLocator('#linked-documents-grid');
    }


    public static getGridElements() {

        return getLocator('.type-grid-element');
    }


    public static getGridElement(identifier: string) {

        return getLocator('#type-grid-element-' + identifier);
    }


    public static getToggleFindsSectionButton() {

        return getLocator('#toggle-finds-section-button');
    }


    // text

    public static getTypeBadgeText(identifier: string) {

        return getText('#type-grid-element-' + identifier + ' .badge');
    }


    public static getActiveNavigationButtonText() {

        return getText('.navigation-button.root-document');
    }
}
