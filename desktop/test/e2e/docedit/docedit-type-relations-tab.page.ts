import {by, element} from 'protractor';

const common = require('../common.js');


/**
 * @author Thomas Kleinke
 */
export class DoceditTypeRelationsTabPage {

    // click

    public static clickAddTypeRelationButton(fieldName: string) {

        common.click(element(by.css('#edit-form-element-' + fieldName + ' .add-type-relation')));
    }


    public static clickType(identifier: string) {

        common.click(element(by.css('#type-row-' + identifier + ' .type-info')));
    }


    public static clickCriterionOption(index: number) {

        common.click(element.all(by.css('#criterion-select option')).get(index));
    }


    public static clickCatalogOption(index: number) {

        common.click(element.all(by.css('#catalog-select option')).get(index));
    }


    // get

    public static getCriterionOptions() {

        return element.all(by.css('#criterion-select option'));
    }


    public static getCatalogOptions() {

        return element.all(by.css('#catalog-select option'));
    }


    public static getTypeRow(identifier: string) {

        return element(by.id('type-row-' + identifier));
    }
}