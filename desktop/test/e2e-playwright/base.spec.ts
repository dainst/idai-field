const { test, expect } = require('@playwright/test');
import { getAppDataPath, getElement, getUrl, start, stop } from './app';


test('test', async () => {

    await start();

    console.log(await getAppDataPath());
    console.log(await getUrl());

    const badge = getElement('#projects-badge');
    expect(await badge.textContent()).toContain('test');

    await stop();
});


export {};
