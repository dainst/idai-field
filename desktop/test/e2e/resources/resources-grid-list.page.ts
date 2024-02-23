import { click, getLocator, rightClick, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ResourcesGridListPage {

    // click

    public static async clickGridElement(identifier: string) {

        return click(await this.getGridElement(identifier));
    }


    public static clickEditButton() {

        return click('.edit-button');
    }


    public static clickNavigationRootButton() {

        return click('#grid-list-navigation-root');
    }


    public static async clickOpenContextMenu(identifier: string) {

        return rightClick(await this.getGridElement(identifier));
    }


    public static async clickToggleLinkedDocumentsSectionButton() {

        return click(await this.getToggleLinkedDocumentsSectionButton());
    }


    // elements

    public static getLinkedDocumentsGrid() {

        return getLocator('#linked-documents-grid');
    }


    public static getGridElements() {

        return getLocator('.grid-item-container');
    }


    public static getGridElement(identifier: string) {

        return getLocator('#grid-item-' + identifier);
    }


    public static getToggleLinkedDocumentsSectionButton() {

        return getLocator('#toggle-linked-documents-section-button');
    }


    // text

    public static getLinkedDocumentBadgeText(identifier: string) {

        return getText('#grid-item-' + identifier + ' .badge');
    }
}
