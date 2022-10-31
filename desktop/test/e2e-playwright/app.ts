
const { _electron: electron } = require('playwright');
import { append, isString } from 'tsfun';

const fs = require('fs');

let electronApp;
let window;


export async function start() {

    electronApp = await electron.launch({ args: ['.', 'test'] });
    window = await electronApp.firstWindow();
    //return waitForExist('router-outlet');
}


export function stop() {

    return electronApp.close();
}


export function resetApp() {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/reset', () => {
            resolve(undefined);
        });
    });
}


export function getAppDataPath(): Promise<string> {

    return window.evaluate(() => require('@electron/remote').getGlobal('appDataPath'));
}


export async function getUrl(): Promise<string> {

    return window.evaluate(() => require('@electron/remote').getCurrentWindow().webContents.getURL());

    /*return await electronApp.evaluate(
        async ({ BrowserWindow }) => BrowserWindow.getFocusedWindow().webContents.getURL()
    );*/

    //return (await electronApp.browserWindow(window)).webContents.getURL();
}


/*export function navigateTo(menu) {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/navigate', {
            headers: { 'content-type' : 'application/json' },
            body: JSON.stringify({ menu: menu })
        } , () => { resolve(undefined); });
    });
}


export async function resetConfigJson() {

    const configPath = await app.electron.remote.getGlobal('configPath');
    const configTemplate = await app.electron.remote.getGlobal('configTemplate');

    return new Promise(resolve => {
        fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
            if (err) console.error('Failure while resetting config.json', err);
            resolve(undefined);
        });
    });
}

*/
export function getElement(selector: string) {

    return window.locator(selector);
}
/*

export function getElements(selector: string) {

    return app.client.$$(selector);
}


export async function click(element, x?, y?) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    const options = x && y ? { x, y } : {};
    return element.click(options);
}


export async function doubleClick(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.doubleClick();
}


export async function rightClick(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.click({ button: 'right' });
}


export function clickWithControlKey(element) {

    return clickWithKey(element, '\uE009');
}


export function clickWithShiftKey(element) {

    return clickWithKey(element, '\uE008');
}


async function clickWithKey(element, keyCode) {

    if (isString(element)) element = await getElement(element);

    const position = await element.getLocation();
    const size = await element.getSize();
    const x = Math.floor(position.x + (size.width / 2));
    const y = Math.floor(position.y + (size.height / 2));

    await app.client.performActions([
        {
            type: 'key',
            id: 'keyboard',
            actions: [
                { type: 'keyDown', value: keyCode }
            ]
        },
        {
            type: 'pointer',
            id: 'mouse',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', x: x, y: y, duration: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: 100 },
                { type: 'pointerUp', button: 0 }
            ]
        }
    ]);

    return app.client.releaseActions();
}


export async function hover(element) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.moveTo();
}

*/
export async function waitForExist(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitFor();
}
/*

export async function waitForNotExist(element) {

    if (isString(element)) element = await getElement(element);
    return element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT, reverse: true });
}


export async function typeIn(element, text) {

    if (isString(element)) element = await getElement(element);
    await element.waitForExist({ timeout: WAIT_FOR_ELEMENT_TIMEOUT });
    return element.setValue(text);
}


export async function clearText(element) {

    if (isString(element)) element = await getElement(element);
    await click(element);
    
    const os = await getOs();
    await pressKeys([os === 'Darwin' ? 'Command' : 'Control', 'A']);
    return pressKeys(['Delete']);
}


export async function pressKeys(keys) {

    await app.client.keys(keys);
}


export async function selectOption(element, optionValue) {

    if (isString(element)) element = await getElement(element);
    return element.selectByAttribute('value', optionValue);
}


export async function getText(element) {

    if (isString(element)) element = await getElement(element);
    await waitForExist(element);
    return element.getText();
}


export async function getValue(element) {

    if (isString(element)) element = await getElement(element);
    await waitForExist(element);
    return app.client.executeScript('return arguments[0].value', [element]);
}


export async function uploadInFileInput(element, filePath) {

    if (isString(element)) element = await getElement(element);
    const file = await app.client.uploadFile(filePath);
    return element.addValue(file);
}


export function pause(milliseconds) {

    return app.client.pause(milliseconds);
}


function getOs() {

    return app.electron.remote.getGlobal('os');
}*/