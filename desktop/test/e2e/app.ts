const Application = require('spectron').Application;
const electron = require('electron');

const WAIT_FOR_ELEMENT_TIMEOUT = 30000;

const app = new Application({
    path: electron,
    args: ['.', 'dev']
});


export function start() {

    return app.start();
}


export function stop() {

    return app.stop();
}


export function reset() {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/reset', () => {
            resolve(undefined);
        });
    });
}


export function getElement(selector: string) {

    return app.client.$(selector);
}


export async function click(element) {

    if (typeof element === 'string') element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.click();
}


export async function doubleClick(element) {

    if (typeof element === 'string') element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.doubleClick();
}


export async function rightClick(element) {

    if (typeof element === 'string') element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.click({ button: 'right' });
}


export async function hover(element) {

    if (typeof element === 'string') element = await getElement(element);
    await element.waitForExists({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.moveTo();
}


export async function waitForExist(element) {

    if (typeof element === 'string') element = await getElement(element);
    return element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
}


export async function waitForNotExist(element) {

    if (typeof element === 'string') element = await getElement(element);
    return element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT, reverse: true });
}


export function pause(milliseconds) {

    return app.client.pause(milliseconds);
}