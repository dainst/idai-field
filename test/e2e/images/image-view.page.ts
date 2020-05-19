import {element, by} from 'protractor';

const common = require('../common.js');


export module ImageViewPage {

    export function editDocument() {

        common.click(element(by.className('mdi-pencil')));
    }


    export function clickCloseButton() {

        common.click(element(by.id('close-button')));
    }


    export function openRelationsTab() {

        common.click(element.all(by.className('card-header')).get(3));
    }


    export function clickRelation() {

        element.all(by.className('resources-listing-item')).get(0).click();
    }


    export function getIdentifier() {

        return element(by.css('.identifier-label')).getText();
    }
}
