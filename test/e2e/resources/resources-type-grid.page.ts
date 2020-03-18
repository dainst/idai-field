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
}