import { click, clickWithControlKey, clickWithShiftKey, getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';
import { SearchBarPage } from '../widgets/search-bar.page';


describe('resources/multi-select --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        done();
    });


    afterAll(async done => {

        await stop();
        done();
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
        await ResourcesPage.typeInMoveModalSearchBarInput('S2');
        await ResourcesPage.clickResourceListItemInMoveModal('S2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

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


    it('delete multiple resources with control key selection', async done => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('3'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('2'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('1'));
        await testDeletingResources();

        done();
    });


    it('delete multiple resources with shift key selection', async done => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('3'));
        await testDeletingResources();

        done();
    });


    it('delete multiple resources on different hierarchy levels', async done => {

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

        done();
    });


    it('move multiple resources', async done => {

        await createResources();
        await click(await ResourcesPage.getListItemEl('1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('3'));
        await testMovingResources();

        done();
    });


    it('show correct target categories when moving multiple resources in overview search', async done => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('O1', 'place');
        await ResourcesPage.clickHierarchyButton('O1');
        await ResourcesPage.clickOpenChildCollectionButton();
        await ResourcesPage.performCreateResource('B2', 'operation-building');

        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickOpenContextMenu('B2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        let labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(labels.length).toBe(2);
        expect(await getText(labels[0])).toEqual('Projekt');
        expect(await getText(labels[1])).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await ResourcesPage.clickCancelInMoveModal();

        await click(await ResourcesPage.getListItemEl('B1'));
        await clickWithShiftKey(await ResourcesPage.getListItemEl('B2'));
        await ResourcesPage.clickOpenContextMenu('B2');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await ResourcesPage.clickCancelInMoveModal();
        
        await clickWithShiftKey(await ResourcesPage.getListItemEl('SE0'));
        await ResourcesPage.clickOpenContextMenu('SE0');
        await waitForNotExist(await ResourcesPage.getContextMenuMoveButton());

        done();
    });
});
