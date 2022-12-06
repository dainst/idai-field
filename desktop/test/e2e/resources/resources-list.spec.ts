import { click, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';
import { DoceditPage } from '../docedit/docedit.page';
import { FieldsViewPage } from '../widgets/fields-view.page';

const { test, expect } = require('@playwright/test');


test.describe('resources/list --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickListModeButton();
    });


    test.afterAll(async () => {

        await stop();
    });


   test('show newly created resource in list view', async () => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');

        const inputValue = await ResourcesPage.getListModeInputFieldValue('1', 0);
        expect(inputValue).toEqual('1');
    });


    test('save changes on input field blur', async () => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        await click(await ResourcesPage.getListModeInputField('2', 0));

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('1', 'info');

        expect(await FieldsViewPage.getFieldValue(0, 1)).toEqual('Changed resource 1');
    });


    test('navigate to child item view in list mode and create a new child object', async () => {

        await ResourcesPage.performCreateResourceInList('5', 'feature-architecture');
        await ResourcesPage.clickHierarchyButton('5');
        await ResourcesPage.performCreateResourceInList('child1', 'find');
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');

        expect(await ResourcesPage.getListModeInputFieldValue('child1', 0)).toEqual('child1');
    });


    test('restore identifier from database if a duplicate identifier is typed in', async () => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('3', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('2', 0, '1');
        await click(await ResourcesPage.getListModeInputField('3', 0));

        expect(await NavbarPage.getMessageText()).toContain('existiert bereits');
        expect(await ResourcesPage.getListModeInputFieldValue('2', 0)).toEqual('2');

        await NavbarPage.clickCloseAllMessages();
    });


    test('restore identifier from database if an empty string is typed in as identifier', async () => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('1', 0, '');
        await click(await ResourcesPage.getListModeInputField('2', 0));
        expect(await ResourcesPage.getListModeInputFieldValue('1', 0)).toEqual('1');

        await ResourcesPage.typeInListModeInputField('1', 0, '  ');
        await click(await ResourcesPage.getListModeInputField('2', 0));
        expect(await ResourcesPage.getListModeInputFieldValue('1', 0)).toEqual('1');
    });


    test('edit a resource via editor modal', async () => {

        await ResourcesPage.clickListEditButton('SE0');
        await DoceditPage.typeInInputField('shortDescription', 'Test');
        await DoceditPage.clickSaveDocument();

        expect(await ResourcesPage.getListModeInputFieldValue('SE0', 0)).toEqual('SE0');
        expect(await ResourcesPage.getListModeInputFieldValue('SE0', 1)).toEqual('Test');
    });


    test('move a resource', async () => {

        await ResourcesPage.clickListMoveButton('SE0');
        await ResourcesPage.typeInMoveModalSearchBarInput('S2');
        await ResourcesPage.clickResourceListItemInMoveModal('S2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        expect(await NavbarPage.getActiveNavLinkLabel()).toContain('S2');
        
        const rows = await ResourcesPage.getListRows();
        expect(await rows.count()).toBe(7);
    });


    test('delete a resource', async () => {

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));
        await ResourcesPage.clickListDeleteButton('SE0');
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await ResourcesPage.getListItemEl('SE0'));
    });
});
