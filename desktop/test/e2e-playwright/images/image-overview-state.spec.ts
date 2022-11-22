import { navigateTo, pause, resetApp, start, stop } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { NavbarPage } from '../navbar.page';
import { SearchBarPage } from '../widgets/search-bar.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('images/state --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('images');
        await ImageOverviewPage.waitForCells();
    });


    test.afterAll(async () => {

        await stop();
    });


    test('autoselect last selected category filter after returning to image overview', async () => {

        let cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(2);

        await SearchBarPage.clickChooseCategoryFilter('image-drawing', 'images');
        await pause(1000);
        cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(1);

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        const value = await SearchBarPage.getSelectedCategoryFilterCharacter('images');
        expect(value).toEqual('Z');

        cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(1);
    });


    test('restore query string after returning to image overview', async () => {

        let cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(2);

        await SearchBarPage.typeInSearchField('Layer 1');
        await pause(1000);
        cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(1);

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        const value = await SearchBarPage.getSearchBarInputFieldValue();
        expect(value).toEqual('Layer 1');

        cells = await ImageOverviewPage.getAllCells();
        expect(await cells.count()).toBe(1);
    });


    test('restore grid size after returning to image overview', async () => {

        await ImageOverviewPage.clickIncreaseGridSizeButton();
        expect(await ImageOverviewPage.getGridSizeSliderValue()).toEqual('5');

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        expect(await ImageOverviewPage.getGridSizeSliderValue()).toEqual('5');
    });
});
