import { isString } from 'tsfun';

const Application = require('spectron').Application;
const electron = require('electron');

const WAIT_FOR_ELEMENT_TIMEOUT = 30000;


jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;


const app = new Application({
    path: electron,
    args: ['.', 'test']
});


export function start() {

    return app.start();
}


export function stop() {

    return app.stop();
}


export function resetApp() {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/reset', () => {
            resolve(undefined);
        });
    });
}


export function navigateTo(menu) {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/navigate', {
            headers: { 'content-type' : 'application/json' },
            body: JSON.stringify({ menu: menu }) 
        } , () => { resolve(undefined); });
    });
}


export function getElement(selector: string) {

    return app.client.$(selector);
}


export function getElements(selector: string) {

    return app.client.$$(selector);
}


export async function click(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.click();
}


export async function doubleClick(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.doubleClick();
}


export async function rightClick(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForClickable({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.click({ button: 'right' });
}


export async function hover(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExists({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.moveTo();
}


export async function waitForExist(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
}


export async function waitForNotExist(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT, reverse: true });
}


export async function waitForVisible(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitForDisplayed({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
}


export async function waitForInvisible(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitForDisplayed({ timeout: WAIT_FOR_ELEMENT_TIMEOUT, reverse: true });
}


export async function typeIn(element, text) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.setValue(text);
}


export async function getText(element) {

    if (isString(element)) element = await getElement(element);
    await waitForExist(element);
    return element.getText();
}


export function pause(milliseconds) {

    return app.client.pause(milliseconds);
}
