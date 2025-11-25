import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createInvalidProcessStateWarning } from './create-warnings';
import { WorkflowEditorModalPage } from '../widgets/workflow-editor-modal.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/invalid process state', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidProcessStateWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('solve warnings for invalid process state via resources view', async () => {

        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuEditWorkflowButton();
        await WorkflowEditorModalPage.editProcess(0);
        await DoceditPage.clickSelectOption('state', 'Abgeschlossen');
        await DoceditPage.clickSaveDocument();
        await WorkflowEditorModalPage.clickCancel();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for invalid process state via warnings modal', async () => {

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültiger Status Geplant']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickSelectOption('state', 'Abgeschlossen');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
