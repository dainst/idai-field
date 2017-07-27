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

function click(el) {
    browser.wait(EC.visibilityOf(el), delays.ECWaitTime);
    return el.click();
}

module.exports = {
    typeIn: typeIn,
    click: click
};
