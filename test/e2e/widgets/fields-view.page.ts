'use strict';

import {browser, protractor, element, by} from 'protractor';
import {el} from '@angular/platform-browser/testing/src/browser_util';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class FieldsViewPage {

    public static clickFieldsTab() {

        return common.click(element(by.id('document-view-fields-tab')));
    }


    public static getTabs() {

        const elDescriptor = 'fields-view div .card-header';
        return element.all(by.css(elDescriptor));
    }


    /**
     * @param cardIndex counting from 0 for the first card
     */
    public static clickAccordionTab(cardIndex) {

        const elDescriptor = 'fields-view div:nth-child(' + (cardIndex + 1) + ') .card-header';
        return common.click(element(by.css(elDescriptor)));
    };


    /**
     * @param cardIndex counting from 0 for the first card
     * @param index counting from 0 for the first field
     */
    public static getFieldValue(cardIndex, index) {

        const elDescriptor = 'fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-value';

        browser.wait(EC.visibilityOf(element(by.css(elDescriptor))), delays.ECWaitTime);
        return element(by.css(elDescriptor)).getText();
    };


    /**
     * @param cardIndex counting from 0 for the first card
     * @param index counting from 0 for the first field
     */
    public static getFieldName(cardIndex, index) {

        const elDescriptor = 'fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-label';

        browser.wait(EC.visibilityOf(element(by.css(elDescriptor))), delays.ECWaitTime);
        return element(by.css(elDescriptor)).getText();
    };


    public static getFields(cardIndex) {

        const elDescriptor = 'fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body > div';

        browser.wait(EC.visibilityOf(element(by.css(elDescriptor))), delays.ECWaitTime);
        return element.all(by.css(elDescriptor))
    };


    public static getFieldElement(index) {

        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'));
    }

}