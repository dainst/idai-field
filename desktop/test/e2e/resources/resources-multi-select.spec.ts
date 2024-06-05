import { click, clickWithControlKey, clickWithShiftKey, getText, navigateTo, resetApp, start, stop,
    waitForExist, waitForNotExist, scrollTo } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { MoveModalPage } from '../widgets/move-modal.page';

const { test, expect } = require('@playwright/test');


test.describe('resources/multi-select --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
    });


    test.afterAll(async () => {

        await stop();
    });


    const createResources = async () => {

        await ResourcesPage.performCreateResource('1');
        await ResourcesPage.performCreateResource('2');
        await ResourcesPage.performCreateResource('3');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await waitForExist(await ResourcesPage.getListItemEl('3'));
    };


    const testDeletingResources = async () => {

        await ResourcesPage.clickOpenContextMenu('1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await ResourcesPage.getListItemEl('1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await waitForNotExist(await ResourcesPage.getListItemEl('3'));
    };


    const testMovingResources = async () => {

        await ResourcesPage.clickOpenContextMenu('1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S2');
        await MoveModalPage.clickResourceListItem('S2');
        await waitForNotExist(await MoveModalPage.getModal());

        expect(await NavbarPage.getActiveNavLinkLabel()).toContain('S2');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await waitForExist(await ResourcesPage.getListItemEl('3'));

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await waitForNotExist(await ResourcesPage.getListItemEl('1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await waitForNotExist(await ResourcesPage.getListItemEl('3'));
    };


    test('delete multiple resources with control key selection', async () => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('3'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('2'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('1'));
        await testDeletingResources();
    });


    test('delete multiple resources with shift key selection', async () => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('3'));
        await testDeletingResources();
    });


    test('delete multiple resources on different hierarchy levels', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickSwitchHierarchyMode();

        await waitForExist(await ResourcesPage.getListItemEl('PQ1'));
        await waitForExist(await ResourcesPage.getListItemEl('PQ1-ST1'));
        await waitForExist(await ResourcesPage.getListItemEl('PQ2'));

        await click(await ResourcesPage.getListItemEl('PQ2'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('PQ1'));
        await ResourcesPage.clickOpenContextMenu('PQ2');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('PQ1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesPage.getListItemEl('PQ1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('PQ1-ST1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('PQ2'));
    });


    test('move multiple resources', async () => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('3'));
        await testMovingResources();
    });


    test('show correct target categories when moving multiple resources in overview search', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('O1', 'place');
        await ResourcesPage.clickHierarchyButton('O1');
        await ResourcesPage.performCreateResource('B2', 'operation-building');

        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickOpenContextMenu('B2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        let labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(await labels.count()).toBe(2);
        expect(await getText(labels.nth(0))).toEqual('Projekt');
        expect(await getText(labels.nth(1))).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await MoveModalPage.clickCancel();

        await click(await ResourcesPage.getListItemEl('B1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('B2'));
        await ResourcesPage.clickOpenContextMenu('B2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(await labels.count()).toBe(1);
        expect(await getText(labels.nth(0))).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await MoveModalPage.clickCancel();
        
        await clickWithShiftKey(await ResourcesPage.getListItemEl('SE0'));
        await ResourcesPage.clickOpenContextMenu('SE0');
        await waitForNotExist(await ResourcesPage.getContextMenuMoveButton());
    });


    test('contextMenu/moveModal - do not suggest a common parent resource of selected resources', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickSwitchHierarchyMode();

        await click(await ResourcesPage.getListItemEl('SE1'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('SE2'));
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S2');
        await waitForNotExist(MoveModalPage.getNoResourcesFoundInfo());

        await MoveModalPage.clickCancel();
    });


    test('contextMenu/moveModal - allow moving resources if at least one resource has a different parent', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('1');

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S2');
        await ResourcesPage.performCreateResource('2');

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickSwitchHierarchyMode();

        await click(await ResourcesPage.getListItemEl('1'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('2'));
        await ResourcesPage.clickOpenContextMenu('1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S2');
        await MoveModalPage.clickResourceListItem('S2');
        await waitForNotExist(await MoveModalPage.getModal());

        expect(await NavbarPage.getActiveNavLinkLabel()).toContain('S2');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await waitForNotExist(await ResourcesPage.getListItemEl('1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
    });
});
