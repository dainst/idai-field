import {browser, protractor, element} from 'protractor';

let EC = protractor.ExpectedConditions;
let delays = require('./config/delays');

/**
 * Common functions to be used in multiple e2e tests.
 */

function typeIn(inputField, text) {
    browser.wait(EC.visibilityOf(inputField), delays.ECWaitTime);
    inputField.clear();
    for (let i in text) {
        inputField.sendKeys(text[i]);
    }
    return inputField;
}

function click(elSel) {
    browser.wait(EC.visibilityOf(element(elSel)), delays.ECWaitTime);
    return element(elSel).click();
}

module.exports = {
    typeIn: typeIn,
    click: click
};
