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
}