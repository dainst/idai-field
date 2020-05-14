import {element, by} from 'protractor';

const common = require('../common.js');


/**
 * @author Thomas Kleinke
 */
export class ResourcesTypeGridPage {

    // click

    public static clickGridElement(identifier: string) {

        return common.click(this.getTypeGridElement(identifier));
    }


    public static clickEditButton() {

        return common.click(element(by.css('.edit-button')));
    }


    public static clickTypeCatalogsNavigationButton() {

        return common.click(element(by.id('types-navigation-root')));
    }


    public static clickOpenContextMenu(identifier: string) {

        common.rightClick(this.getTypeGridElement(identifier));
    }


    // elements

    public static getLinkedDocumentsGrid() {

        return element(by.id('linked-documents-grid'));
    }


    public static getTypeGridElements() {

        return element.all(by.css('.type-grid-element'));
    }


    public static getTypeGridElement(identifier: string) {

        return element(by.id('type-grid-element-' + identifier));
    }


    public static getLinkedDocumentGridElement(identifier: string) {

        return element(by.id('type-grid-element-linked-document-' + identifier));
    }


    // text

    public static getTypeBadgeText(identifier: string) {

        return element(by.css('#type-grid-element-linked-document-' + identifier + ' .badge'))
            .getText();
    }


    public static getActiveNavigationButtonText() {

        return element(by.css('.navigation-button.root-document')).getText();
    }
}