import { navigateTo, resetApp, start, stop, click, clickWithControlKey, pause } from '../app';
import { ResourcesPage } from './resources.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { NavbarPage } from '../navbar.page';
import { ConfigurationPage } from '../configuration/configuration.page';
import { AddCategoryFormModalPage } from '../configuration/add-category-form-modal.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { ProcessListPage } from '../widgets/process-list.page';
import { WorkflowEditorModalPage } from '../widgets/workflow-editor-modal.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('resources/workflow', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await configureProcessCategory();
    });


    test.afterAll(async () => {

        await stop();
    });


    async function configureProcessCategory() {

        await navigateTo('configuration');

        await ConfigurationPage.clickSelectCategoriesFilter('workflow');
        await ConfigurationPage.clickCreateSubcategory('Process');
        await AddCategoryFormModalPage.typeInSearchFilterInput('TestProcess');
        await AddCategoryFormModalPage.clickCreateNewCategory();
        await CategoryPickerPage.clickSelectCategory('Feature', undefined, 'is-carried-out-on-target-container');
        await ConfigurationPage.clickNextInCreateProcessModal();
        await CategoryPickerPage.clickSelectCategory('Find', undefined, 'results-in-target-container');
        await ConfigurationPage.clickNextInCreateProcessModal();
        await EditConfigurationPage.typeInTranslation(0, 0, 'Test-Prozess', 'category');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    }


    async function createProcessInOverview(identifier: string, state: string, date: string,
                                           carriedOutOnTargetIdentifier: string) {

        await ResourcesPage.clickCreateResource();
        await DoceditPage.typeInInputField('identifier', identifier);
        await DoceditPage.clickSelectOption('state', state);
        await DoceditPage.typeInDateInputField('date', date);
        await DoceditPage.clickSelectGroup('workflow');
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isCarriedOutOn');
        await DoceditRelationsPage.typeInRelation('isCarriedOutOn', carriedOutOnTargetIdentifier);
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();
    }


    async function createProcessInModal(identifier: string, state: string, date: string) {

        await WorkflowEditorModalPage.clickPlusButton();
        await DoceditPage.typeInInputField('identifier', identifier);
        await DoceditPage.clickSelectOption('state', state);
        await DoceditPage.typeInDateInputField('date', date);
        await DoceditPage.clickSaveDocument();
    }


    test('create and sort processes in overview', async () => {

        await navigateTo('resources/workflow');
        await createProcessInOverview('1', 'Abgeschlossen', '01.01.2025', 'SE1');
        await createProcessInOverview('2', 'Abgeschlossen', '01.01.2023', 'SE2');
        await createProcessInOverview('3', 'Abgeschlossen', '01.01.2024', 'SE3');

        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('2');

        await ProcessListPage.clickToggleSortByDate();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('1');

        await ProcessListPage.clickToggleSortByIdentifier();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('3');

        await ProcessListPage.clickToggleSortByIdentifier();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('1');
    });


    test('create and sort processes in document workflow modal', async () => {

        await ResourcesPage.clickHierarchyButton('S2');
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();

        await createProcessInModal('1', 'Abgeschlossen', '01.01.2025');
        await createProcessInModal('2', 'Abgeschlossen', '01.01.2023');
        await createProcessInModal('3', 'Abgeschlossen', '01.01.2024');

        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('1');

        await ProcessListPage.clickToggleSortByDate();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('2');

        await ProcessListPage.clickToggleSortByIdentifier();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('3');

        await ProcessListPage.clickToggleSortByIdentifier();
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('3');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('1');

        await WorkflowEditorModalPage.clickCancel();
    });


    test('create a single process carried out on multiple resources', async () => {

        await ResourcesPage.clickHierarchyButton('S2');
        await click(await ResourcesPage.getListItemEl('SE3'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('SE2'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('SE1'));
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
    
        await WorkflowEditorModalPage.clickPlusButton();
        await WorkflowEditorModalPage.clickCreateSingleProcessButton();
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickSelectOption('state', 'Abgeschlossen');
        await DoceditPage.typeInDateInputField('date', '01.01.2025');
        await DoceditPage.clickSaveDocument();

        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickSelectResource('SE1');
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickOpenContextMenu('SE2');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickOpenContextMenu('SE3');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        await WorkflowEditorModalPage.clickCancel();
    });


    test('create one process per selected resource', async () => {

        await ResourcesPage.clickHierarchyButton('S2');
        await click(await ResourcesPage.getListItemEl('SE3'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('SE2'));
        await clickWithControlKey(await ResourcesPage.getListItemEl('SE1'));
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
    
        await WorkflowEditorModalPage.clickPlusButton();
        await WorkflowEditorModalPage.clickCreateMultipleProcessesButton();
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickSelectOption('state', 'Abgeschlossen');
        await DoceditPage.typeInDateInputField('date', '01.01.2025');
        await DoceditPage.clickSaveDocument();
        await pause(1000);

        expect(await (await ProcessListPage.getProcesses()).count()).toBe(3);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        expect(await ProcessListPage.getProcessIdentifier(1)).toEqual('2');
        expect(await ProcessListPage.getProcessIdentifier(2)).toEqual('3');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickSelectResource('SE1');
        await ResourcesPage.clickOpenContextMenu('SE1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('1');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickOpenContextMenu('SE2');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('2');
        await WorkflowEditorModalPage.clickCancel();

        await ResourcesPage.clickOpenContextMenu('SE3');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        expect(await (await ProcessListPage.getProcesses()).count()).toBe(1);
        expect(await ProcessListPage.getProcessIdentifier(0)).toEqual('3');
        await WorkflowEditorModalPage.clickCancel();
    });
});
