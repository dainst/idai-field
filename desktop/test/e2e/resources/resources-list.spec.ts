import { click, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from './resources.page';
import { DoceditPage } from '../docedit/docedit.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { ConfigurationPage } from '../configuration/configuration.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { ManageValuelistsModalPage } from '../configuration/manage-valuelists-modal.page';
import { MoveModalPage } from '../widgets/move-modal.page';

const { test, expect } = require('@playwright/test');


test.describe('resources/list', () => {

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


    test('create new resource', async () => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory('feature-architecture');
        expect(await ResourcesPage.getListModeInputFieldValue(undefined, 0)).toEqual('');

        await ResourcesPage.typeInNewResourceAndHitEnterInList('1');
        expect(await ResourcesPage.getListModeInputFieldValue('1', 0)).toEqual('1');
    });


    test('hide edit and move buttons for new resources', async () => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory('feature-architecture');
        expect(await (await ResourcesPage.getListButton('edit')).getAttribute('class'))
            .not.toContain('hidden-option');
        expect(await (await ResourcesPage.getListButton('move')).getAttribute('class'))
            .toContain('hidden-option');
        expect(await (await ResourcesPage.getListButton('delete')).getAttribute('class'))
            .toContain('hidden-option');

        await ResourcesPage.typeInNewResourceAndHitEnterInList('1');
        expect(await (await ResourcesPage.getListButton('edit', '1')).getAttribute('class'))
            .not.toContain('hidden-option');
        expect(await (await ResourcesPage.getListButton('move', '1')).getAttribute('class'))
            .not.toContain('hidden-option');
        expect(await (await ResourcesPage.getListButton('delete', '1')).getAttribute('class'))
            .not.toContain('hidden-option');
    });


    test('save changes on input field blur', async () => {

        await ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        await ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        await ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        await click(await ResourcesPage.getListModeInputField('2', 0));

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('1');

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
        await MoveModalPage.typeInSearchBarInput('S2');
        await MoveModalPage.clickResourceListItem('S2');
        await waitForNotExist(await MoveModalPage.getModal());

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


    test('select value from valuelist for short description field', async () => {
        
        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Operation');
        await ConfigurationPage.clickOpenContextMenuForField('shortDescription');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'field');
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('test-list');
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue('testValue1');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.typeInTranslation(0, 0, 'Value 1', 'value');
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.typeInNewValue('testValue2');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.typeInTranslation(0, 0, 'Value 2', 'value');
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickListModeButton();
        await ResourcesPage.performCreateResourceInList('Trench1', 'operation-trench');
        await ResourcesPage.clickListSelectOption('Trench1', 'Value 1');
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('Trench1');
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Value 1');
        
        await ResourcesPage.clickListModeButton();
        await ResourcesPage.clickListSelectOption('Trench1', 'Value 2');
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('Trench1');
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Value 2');    
    });
});
