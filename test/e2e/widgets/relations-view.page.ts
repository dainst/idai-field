'use strict';

import {browser, protractor, element, by} from 'protractor';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class RelationsViewPage {

    public static clickRelation(relationIndex) {

        return element.all(by.css('#relations-view .resources-listing-item')).get(relationIndex).click();
    };


    public static getRelations() {

        return element.all(by.css('#relations-view .resources-listing-item'));
    };


    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationValue(index) {

        browser.wait(EC.visibilityOf(element.all(by.css('#relations-view .title')).get(index)), delays.ECWaitTime);
        return element.all(by.css('#relations-view .title')).get(index).getText();
    };


    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationName(index) {

        browser.wait(EC.visibilityOf(element.all(by.css('#relations-view .relation-name'))
            .get(index)), delays.ECWaitTime);
        return element.all(by.css('#relations-view .relation-name')).get(index).getText();
    };
}