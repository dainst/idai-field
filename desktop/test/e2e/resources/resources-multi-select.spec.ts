import { click, clickWithControlKey, clickWithShiftKey, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';


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
});
