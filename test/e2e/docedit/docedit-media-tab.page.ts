import {element, by, browser, protractor} from 'protractor';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common.js');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditMediaTabPage {

    public static waitForCells() {

        return browser.wait(EC.presenceOf(element(by.css('.cell'))), delays.ECWaitTime,
            'Waiting for image cells.');
    }


    // click

    public static clickDeleteMediaResources() {

        return common.click(element(by.id('delete-media-resources')));
    }


    public static clickInsertMediaResource = function() {

        common.click(element(by.id('create-depicts-relations-btn')));
    };


    // elements

    public static getCells() {

        return element.all(by.css('.cell'));
    }
}