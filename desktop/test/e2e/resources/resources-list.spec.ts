import { click, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';
import { DoceditPage } from '../docedit/docedit.page';
import { FieldsViewPage } from '../widgets/fields-view.page';


describe('resources/list --', () => {

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
        await ResourcesPage.clickListModeButton();

        done();
    });


    afterAll(async done => {

        // TODO This can be deleted if we keep stopping the application after each test suite
        await ResourcesPage.clickMapModeButton();

        await stop();
        done();
    });


   it('show newly created resource in list view', async done => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');

        const inputValue = await ResourcesPage.getListModeInputFieldValue('1', 0);
        expect(inputValue).toEqual('1');

        done();
    });


    it('save changes on input field blur', async done => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        await click(await ResourcesPage.getListModeInputField('2', 0));

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('1', 'info');

        const categoryLabel = await FieldsViewPage.getFieldValue(0, 1);
        expect(categoryLabel).toEqual('Changed resource 1');

        done();
    });


    it('navigate to child item view in list mode and create a new child object', async done => {

        await ResourcesPage.performCreateResourceInList('5', 'feature-architecture');
        await ResourcesPage.clickHierarchyButton('5');
        await ResourcesPage.performCreateResourceInList('child1', 'find');
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');

        const inputValue = await ResourcesPage.getListModeInputFieldValue('child1', 0);
        expect(inputValue).toEqual('child1');

        done();
    });


    it('restore identifier from database if a duplicate identifier is typed in', async done => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('3', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('2', 0, '1');
        await click(await ResourcesPage.getListModeInputField('3', 0));

        expect(await NavbarPage.getMessageText()).toContain('existiert bereits');

        const inputValue = await ResourcesPage.getListModeInputFieldValue('2', 0);
        expect(inputValue).toEqual('2');

        await NavbarPage.clickCloseAllMessages();

        done();
    });


    it('edit a resource via editor modal', async done => {

        await ResourcesPage.clickListEditButton('SE0');
        await DoceditPage.typeInInputField('shortDescription', 'Test');
        await DoceditPage.clickSaveDocument();
        let inputValue = await ResourcesPage.getListModeInputFieldValue('SE0', 0);
        expect(inputValue).toEqual('SE0');
        inputValue = await ResourcesPage.getListModeInputFieldValue('SE0', 1);
        expect(inputValue).toEqual('Test'); 

        done();
    });


    it('move a resource', async done => {

        await ResourcesPage.clickListMoveButton('SE0');
        await ResourcesPage.typeInMoveModalSearchBarInput('S2');
        await ResourcesPage.clickResourceListItemInMoveModal('S2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        const label = await NavbarPage.getActiveNavLinkLabel();
        expect(label).toContain('S2');
        
        const rows = await ResourcesPage.getListRows();
        expect(rows.length).toBe(7);

        done();
    });


    it('delete a resource', async done => {

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));
        await ResourcesPage.clickListDeleteButton('SE0');
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await ResourcesPage.getListItemEl('SE0'));

        done();
    });
});
