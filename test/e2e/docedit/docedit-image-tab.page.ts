import {browser, protractor, element, by} from 'protractor';

let common = require('../common.js');
let delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditImageTabPage {

    // click

    public static clickDeleteImages() {

        return common.click(element(by.id('delete-images')));
    }

    public static clickInsertImage = function() {

        common.click(element(by.id('create-depicts-relations-btn')));
    };

    // elements

    public static getCells() {

        return element.all(by.css('.cell'));
    }
}