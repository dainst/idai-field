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
}