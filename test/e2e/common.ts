import {browser, protractor, element} from 'protractor';

let EC = protractor.ExpectedConditions;
let delays = require('./config/delays');
const fs = require('fs');

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

function resetConfigJson(): Promise<any> {

    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    return new Promise(resolve => {
        fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
            if (err) console.error('Failure while resetting config.json', err);
            resolve();
        });
    });
}

module.exports = {
    typeIn: typeIn,
    click: click,
    resetConfigJson: resetConfigJson
};
