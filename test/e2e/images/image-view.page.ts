import {browser, element, by} from 'protractor';

const common = require('../common.js');


export module ImageViewPage {


    export function get(id: string, menu: string) {

        browser.get('#/images/' + id + '/' + menu);
    }


    export function clickCloseButton() {

        common.click(element(by.id('close-button')))
    }


    export function openRelationsTab() {

        common.click(element.all(by.className('card-header')).get(3));
    }


    export function clickRelation() {

        element.all(by.className('resources-listing-item')).get(0).click();
    }
}
