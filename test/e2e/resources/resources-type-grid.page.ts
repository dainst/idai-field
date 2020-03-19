import {element, by} from 'protractor';

const common = require('../common.js');


/**
 * @author Thomas Kleinke
 */
export class ResourcesTypeGridPage {

    // click

    public static clickGridElement(identifier: string) {

        return common.click(element(by.id('type-grid-element-' + identifier)));
    }


    public static clickEditButton() {

        return common.click(element(by.css('.edit-button')));
    }


    // elements

    public static getLinkedDocumentsGrid() {

        return element(by.id('linked-documents-grid'));
    }


    public static getLinkedDocumentGridElement(identifier: string) {

        return element(by.id('type-grid-element-linked-document-' + identifier));
    }


    // text

    public static getTypeBadgeText(identifier: string) {

        return element(by.css('#type-grid-element-linked-document-' + identifier + ' .badge'))
            .getText();
    }
}