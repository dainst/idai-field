const { _electron: electron } = require('playwright');
import { isString } from 'tsfun';

const fs = require('fs');


export interface StartOptions {

    config?: any;
    fakeVideoPath?: string;
};


let electronApp;
let window;

const defaultConfig = {
    'dbs': ['test'],
    'username': 'Test-User'
};


/**
 * Use Playwright to start the Electron application for running e2e tests.
 * 
 * @param fakeVideoPath path to a `.mjpeg` that will be used as fake camera input
 * @returns Promise<any> that will resolve once the application is started.
 */
export async function start(options?: StartOptions): Promise<any> {

    resetConfigJson(options?.config);

    let args = ['.', 'test'];

    if (options?.fakeVideoPath) {
        args = args.concat([
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${options.fakeVideoPath}`
        ]);
    }

    electronApp = await electron.launch({ args });
    window = await electronApp.firstWindow();
    return waitForExist('router-outlet', 60000);
}

/**
 * Stop the Electron application started by Playwright.
 * 
 * @returns Promise<any> that will resolve once the application is stopped.
 */
export function stop(): Promise<any> {

    return electronApp.close();
}


export async function getUrl(): Promise<string> {

    return window.evaluate(() => require('@electron/remote').getCurrentWindow().webContents.getURL());
}


export function navigateTo(menu) {

    return window.evaluate((menuOption) => {
        require('@electron/remote').getCurrentWindow().webContents
            .send('menuItemClicked', menuOption);
    }, menu);
}


export async function resetApp() {

    await sendMessageToAppController('resetApp');
}


export async function sendMessageToAppController(message: string) {

    await window.evaluate(value => require('@electron/remote').getCurrentWindow().webContents.send(value), message);
    return waitForExist("//span[@class='message-content' and contains(text(), 'Erfolgreich ausgeführt')]", 120000);
}


export function resetConfigJson(config = defaultConfig) {

    fs.writeFileSync('test/config/config.test.json', JSON.stringify(config));
}


export function getAppDataPath(): Promise<string> {

    return getGlobal('appDataPath');
}


export function getLocator(selector: string) {

    return window.locator(selector);
}

/**
 * Use Playwright to simulate a click on a specified element.
 * 
 * @param element either a selector (`string`) for the element or an already existing reference to an element.
 * @param x (optional) position relative to the top left corner of the element padding box.
 * @param y (optional) position relative to the top left corner of the element padding box.
 * @returns Promise<any> that will resolve after the click happened.
 */
export async function click(element, x?: number, y?: number) {

    if (isString(element)) element = await getLocator(element);
    const options = x && y ? { position: { x, y } } : {};
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


export async function scrollTo(element) {

    if (isString(element)) element = await getLocator(element);
    return element.scrollIntoViewIfNeeded();
}


export async function waitForExist(element, timeout = 30000) {

    if (isString(element)) element = await getLocator(element);
    return element.waitFor({ state: 'attached', timeout });
}


export async function waitForNotExist(element) {

    if (isString(element)) element = await getLocator(element);
    return element.waitFor({ state: 'hidden' });
}


export async function typeIn(element, text) {

    if (isString(element)) element = await getLocator(element);
    element = await element.elementHandle();

    await clearText(element);
    return element.type(text);
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


export async function selectSearchableSelectOption(element, optionValueLabel) {

    return click(await getSearchableSelectOption(element, optionValueLabel));
}


export async function getSearchableSelectOption(element, optionValueLabel) {

    if (isString(element)) element = await getLocator(element);
    element = await element.locator('.ng-arrow-wrapper');

    await scrollTo(element);
    await click(element);
    
    return getLocator('.ng-dropdown-panel .ng-option span:has-text("' + optionValueLabel + '")');
}


export async function getText(element, trim = true) {

    if (isString(element)) element = await getLocator(element);
    const text = await element.textContent();

    return trim ? text.trim() : text;
}


export async function getByText(text: string) {

    return window.getByText(text);
}


export async function getValue(element) {

    if (isString(element)) element = await getLocator(element);
    return element.inputValue();
}


export async function selectFile(element, filePath) {

    await electronApp.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = (_, __) => Promise.resolve({ filePaths: [path] });
    }, filePath);

    return click(element);
}


export function pause(milliseconds) {

    return new Promise(resolve => setTimeout(() => resolve(undefined), milliseconds));
}


function getGlobal(globalName: string): Promise<any> {

    return window.evaluate(value => require('@electron/remote').getGlobal(value), globalName);
}

