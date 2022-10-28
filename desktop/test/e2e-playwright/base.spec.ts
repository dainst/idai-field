const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');


test('test', async () => {
    const electronApp = await electron.launch({ args: ['.'] });
    const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged);
    expect(isPackaged).toBe(false);

    await electronApp.close();
});


export {};
