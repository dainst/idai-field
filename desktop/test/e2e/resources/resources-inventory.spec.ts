import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist, pause } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesGridListPage } from './resources-grid-list.page';
import { SearchBarPage } from '../widgets/search-bar.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('resources/inventory --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('resources/inventory');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('move storage place resource to inventory root level', async () => {

        await ResourcesPage.performCreateResource('SP1', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesPage.performCreateResource('SP2', 'storageplace', undefined, undefined, false, true);
        
        await ResourcesGridListPage.clickOpenContextMenu('SP2');
        await ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseCategoryFilter('inventoryregister', 'modal');
        await ResourcesPage.clickResourceListItemInMoveModal('Inventarverzeichnis');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        await waitForExist(await ResourcesGridListPage.getGridElement('SP2'));

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('Inventarverzeichnis');
        expect(await getText(navigationButtons.nth(1))).toEqual('SP1');
        expect(await ResourcesPage.getActiveNavigationButtonText()).toEqual('Inventarverzeichnis');
    });
});
