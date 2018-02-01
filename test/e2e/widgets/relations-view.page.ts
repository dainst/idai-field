import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require('./common.js');
const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');

/**
 * @author Daniel de Oliveira
 */
export class RelationsViewPage {


    public static getRelationsTab() {

        return element(by.id('document-view-relations-tab'));
    }


    public static clickRelationsTab() {

        return common.click(element(by.id('document-view-relations-tab')));
    }


    public static clickRelation(relationIndex) {

        this.clickRelationsTab();
        return element.all(by.css('#document-view-relations-tab-panel .relation-target')).get(relationIndex).click();
    };


    public static getRelations() {

        this.clickRelationsTab();
        browser.sleep(delays.shortRest);
        return element.all(by.css('relations-view .relation-target'));
    };


    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationValue(index) {

        this.clickRelationsTab();
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view .title')).get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view .title')).get(index).getText();
    };


    /**
     * @param index counting from 0 for the first field
     */
    public static getRelationName(index) {

        this.clickRelationsTab();
        browser.wait(EC.visibilityOf(element.all(by.css('relations-view .fieldname'))
            .get(index)), delays.ECWaitTime);
        return element.all(by.css('relations-view .fieldname')).get(index).getText();
    };
}