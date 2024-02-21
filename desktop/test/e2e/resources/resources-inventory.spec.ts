import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesGridListPage } from './resources-grid-list.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { NavbarPage } from '../navbar.page';

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
        await createStoragePlaces();
    });


    test.afterAll(async () => {

        await stop();
    });


    async function createStoragePlaces() {

        await ResourcesPage.performCreateResource('SP1', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesPage.performCreateResource('SP2', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickNavigationRootButton();
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

        await ResourcesGridListPage.clickGridElement('SP1');
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


    test('move storage place into another storage place', async () => {

        await ResourcesPage.performCreateResource('SP3', 'storageplace', undefined, undefined, false, true);        
        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesGridListPage.clickOpenContextMenu('SP2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.typeInSearchField('SP3');
        await ResourcesPage.clickResourceListItemInMoveModal('SP3');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        await waitForExist(await ResourcesGridListPage.getGridElement('SP2'));

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('Inventarverzeichnis');
        expect(await getText(navigationButtons.nth(1))).toEqual('SP3');
        expect(await ResourcesPage.getActiveNavigationButtonText()).toEqual('SP3');
    });


    test('move storage place to inventory root level', async () => {

        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesGridListPage.clickOpenContextMenu('SP2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('inventoryregister', 'modal');
        await ResourcesPage.clickResourceListItemInMoveModal('Inventarverzeichnis');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        await waitForExist(await ResourcesGridListPage.getGridElement('SP2'));

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('Inventarverzeichnis');
        expect(await getText(navigationButtons.nth(1))).toEqual('SP1');
        expect(await ResourcesPage.getActiveNavigationButtonText()).toEqual('Inventarverzeichnis');
    });


    test('delete a storage place', async () => {

        await ResourcesGridListPage.clickGridElement('SP1');
        await ResourcesGridListPage.clickGridElement('SP2');
        await linkWithFind();

        await ResourcesPage.clickNavigationButton('SP1');

        await ResourcesGridListPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        await ResourcesGridListPage.clickOpenContextMenu('SP2');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SP2');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesGridListPage.getGridElement('SP2'));
        await waitForNotExist(await ResourcesGridListPage.getGridElement('testf1'));
    });


    test('update filter icon when leaving inventory view', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();
        await waitForExist(await SearchBarPage.getSelectedCategoryFilterButton('resources'));
        expect(await SearchBarPage.getSelectedCategoryFilterCharacter()).toBe('A');

        await NavbarPage.clickCloseNonResourcesTab();
        await waitForNotExist(await SearchBarPage.getSelectedCategoryFilterButton('resources'));
        await waitForExist(await SearchBarPage.getDefaultFilterIcon('resources'));
    });
});
