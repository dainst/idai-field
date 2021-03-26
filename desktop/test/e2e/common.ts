import {browser, protractor} from 'protractor';

let EC = protractor.ExpectedConditions;
const delays = require('./delays');
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


function click(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    return element.click();
}


function rightClick(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().click(element, protractor.Button.RIGHT).perform();
}


function doubleClick(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().doubleClick(element).perform();
}


function clickWithControlKey(element) {

    clickWithKey(element, protractor.Key.CONTROL);
}


function clickWithShiftKey(element) {

    clickWithKey(element, protractor.Key.SHIFT);
}


function clickWithKey(element, key) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions()
        .mouseMove(element)
        .keyDown(key)
        .click()
        .keyUp(key)
        .perform();
}


function hover(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().mouseMove(element).perform();
}


function resetConfigJson(): Promise<any> {

    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    return new Promise(resolve => {
        fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
            if (err) console.error('Failure while resetting config.json', err);
            resolve(undefined);
        });
    });
}


function resetApp(): Promise<any> {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/reset', () => {
            resolve(undefined);
        });
    });
}


module.exports = {
    typeIn: typeIn,
    click: click,
    rightClick: rightClick,
    doubleClick: doubleClick,
    clickWithControlKey: clickWithControlKey,
    clickWithShiftKey: clickWithShiftKey,
    hover: hover,
    resetConfigJson: resetConfigJson,
    resetApp: resetApp
};
