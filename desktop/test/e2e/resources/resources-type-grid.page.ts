import { click, getElement, getElements, rightClick, getText } from '../app';


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

        return getElement('#linked-documents-grid');
    }


    public static getGridElements() {

        return getElements('.type-grid-element');
    }


    public static getGridElement(identifier: string) {

        return getElement('#type-grid-element-' + identifier);
    }


    public static getToggleFindsSectionButton() {

        return getElement('#toggle-finds-section-button');
    }


    // text

    public static getTypeBadgeText(identifier: string) {

        return getText('#type-grid-element-' + identifier + ' .badge');
    }


    public static getActiveNavigationButtonText() {

        return getText('.navigation-button.root-document');
    }
}
