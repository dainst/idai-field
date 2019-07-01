'use strict';

import {browser, by, element, protractor} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class FieldsViewPage {


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


    public static clickRelation(cardIndex, relationIndex) {

        const elDescriptor = 'fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value';
        return element.all(by.css(elDescriptor)).get(relationIndex).click();
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


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static getRelationValue(cardIndex, index) {

        return element.all(by.className('card')).get(cardIndex).all(by.className('relation-value')).get(index).getText();
    };


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static getRelationName(cardIndex, index) {

        return element.all(by.className('card')).get(cardIndex).all(by.className('field-label')).get(index).getText();
    };


    /**
     * @param cardIndex
     */
    public static getRelations(cardIndex) {

        return element.all(by.className('card')).get(cardIndex).all(by.className('relation-value'));
    };
}