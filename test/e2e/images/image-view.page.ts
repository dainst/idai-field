import {browser, element, by, protractor} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


export module ImageViewPage {


    export function get(id: string, menu: string) {

        browser.get('#/images/' + id + '/' + menu);
    }


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

        // browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar .identifier .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('identifier-label')).getText();
    }
}
