import {element, by} from 'protractor';

const common = require('../common.js');


/**
 * @author Thomas Kleinke
 */
export class ResourcesTypeGridPage {

    // click

    public static clickGridElement(identifier: string) {

        return common.click(this.getGridElement(identifier));
    }


    public static clickEditButton() {

        return common.click(element(by.css('.edit-button')));
    }


    public static clickTypeCatalogsNavigationButton() {

        return common.click(element(by.id('types-navigation-root')));
    }


    public static clickOpenContextMenu(identifier: string) {

        common.rightClick(this.getGridElement(identifier));
    }


    public static clickToggleFindsSectionButton() {

        common.click(element(by.id('toggle-finds-section-button')));
    }


    // elements

    public static getLinkedDocumentsGrid() {

        return element(by.id('linked-documents-grid'));
    }


    public static getGridElements() {

        return element.all(by.css('.type-grid-element'));
    }


    public static getGridElement(identifier: string) {

        return element(by.id('type-grid-element-' + identifier));
    }


    public static getToggleFindsSectionButton() {

        return element(by.id('toggle-finds-section-button'));
    }


    // text

    public static getTypeBadgeText(identifier: string) {

        return element(by.css('#type-grid-element-' + identifier + ' .badge'))
            .getText();
    }


    public static getActiveNavigationButtonText() {

        return element(by.css('.navigation-button.root-document')).getText();
    }
}
