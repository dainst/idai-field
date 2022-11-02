
const { _electron: electron } = require('playwright');
import { isString } from 'tsfun';

const fs = require('fs');

let electronApp;
let window;


export async function start() {

    electronApp = await electron.launch({ args: ['.', 'test'] });
    window = await electronApp.firstWindow();
    return waitForExist('router-outlet');
}


export function stop() {

    return electronApp.close();
}


export async function getUrl(): Promise<string> {

    return window.evaluate(() => require('@electron/remote').getCurrentWindow().webContents.getURL());
}


export async function navigateTo(menu) {

    return window.evaluate((menuOption) => {
        require('@electron/remote').getCurrentWindow().webContents
            .send('menuItemClicked', menuOption);
    }, menu);
}


export async function resetApp() {

    await window.evaluate(() => require('@electron/remote').getCurrentWindow().webContents.send('resetApp'));
    return pause(5000);
}


export async function resetConfigJson() {

    const configPath = await getGlobal('configPath');
    const configTemplate = await getGlobal('configTemplate');

    return new Promise(resolve => {
        fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
            if (err) console.error('Failure while resetting config.json', err);
            resolve(undefined);
        });
    });
}


export function getAppDataPath(): Promise<string> {

    return getGlobal('appDataPath');
}


export function getLocator(selector: string) {

    return window.locator(selector);
}


export async function click(element, x?, y?) {

    if (isString(element)) element = await getLocator(element);
    const options = x && y ? { position: { x, y } } : {};
    return element.click(options);
}


export async function doubleClick(element) {

    if (isString(element)) element = await getLocator(element);
    return element.dblclick();
}


export async function rightClick(element) {

    if (isString(element)) element = await getLocator(element);
    return element.click({ button: 'right' });
}


export async function clickWithControlKey(element) {

    if (isString(element)) element = await getLocator(element);
    return element.click({ modifiers: ['Control'] });
}


export async function clickWithShiftKey(element) {

    if (isString(element)) element = await getLocator(element);
    return element.click({ modifiers: ['Shift'] });
}


export async function hover(element) {

    if (isString(element)) element = await getLocator(element);
    return element.hover();
}


export async function waitForExist(element) {

    if (isString(element)) element = await getLocator(element);
    return element.waitFor({ state: 'attached' });
}


export async function waitForNotExist(element) {

    if (isString(element)) element = await getLocator(element);
    return element.waitFor({ state: 'hidden' });
}


export async function typeIn(element, text) {

    if (isString(element)) element = await getLocator(element);
    return element.fill(text);
}


export async function clearText(element) {

    if (isString(element)) element = await getLocator(element);
    await element.selectText();
    return element.press('Backspace');
}


export async function pressKey(element, key) {

    if (isString(element)) element = await getLocator(element);
    await element.selectText();
    return element.press(key);
}


export async function selectOption(element, optionValue) {

    if (isString(element)) element = await getLocator(element);
    return element.selectOption(optionValue);
}


export async function getText(element) {

    if (isString(element)) element = await getLocator(element);
    return element.textContent();
}


export async function getValue(element) {

    if (isString(element)) element = await getLocator(element);
    return element.inputValue();
}


export async function uploadInFileInput(element, filePath) {

    if (isString(element)) element = await getLocator(element);
    return element.setInputFiles(filePath);
}


export function pause(milliseconds) {

    return new Promise(resolve => setTimeout(() => resolve(undefined), milliseconds));
}


function getGlobal(globalName: string): Promise<any> {

    return window.evaluate(value => require('@electron/remote').getGlobal(value), globalName);
}
