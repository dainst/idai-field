'use strict';

import {browser, protractor, element, by} from 'protractor';

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


    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldValue(index) {

        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'))),
            delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue')).getText();
    };


    /**
     * @param index counting from 0 for the first field
     */
    public static getFieldName(index) {

        browser.wait(EC.visibilityOf(element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname'))),
            delays.ECWaitTime);
        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldname')).getText();
    };


    public static getFields() {

        browser.wait(EC.visibilityOf(element(by.css('fields-view > div'))), delays.ECWaitTime);
        return element.all(by.css('fields-view > div'))
    };


    public static getFieldElement(index) {

        return element(by.css('fields-view div:nth-child(' + (index + 1) + ') .fieldvalue'));
    }

}