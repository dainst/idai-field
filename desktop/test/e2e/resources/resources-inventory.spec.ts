import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesGridListPage } from './resources-grid-list.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';

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


    async function createStoragePlaces() {

        await ResourcesPage.performCreateResource('SP1', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesPage.performCreateResource('SP2', 'storageplace', undefined, undefined, false, true);
    }


    async function linkWithFind() {

        await ResourcesGridListPage.clickEditButton();
        await DoceditPage.clickGotoInventoryTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isStoragePlaceOf');
        await DoceditRelationsPage.typeInRelation('isStoragePlaceOf', 'testf1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        return DoceditPage.clickSaveDocument();
    }


    test('show linked find for storage place', async () => {

        await createStoragePlaces();
        await ResourcesGridListPage.clickGridElement('SP2');
        await waitForNotExist(await ResourcesGridListPage.getLinkedDocumentsGrid());

        await linkWithFind();

        await ResourcesGridListPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        await ResourcesPage.clickNavigationButton('SP1');
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        const text = await ResourcesGridListPage.getLinkedDocumentBadgeText('testf1');
        expect(text).toBe('SP2');
    });


    test('move storage place resource to inventory root level', async () => {

        await createStoragePlaces();
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
