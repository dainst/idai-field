import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createInvalidRelationTargetWarning } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/invalid relation target --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('solve warning for invalid relation target via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidRelationTargetWarning('1', '2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültige Zielressource der Relation Relation 1']);

        await WarningsModalPage.clickCleanUpRelationButton(0);
        await WarningsModalPage.clickConfirmCleanUpInModalButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid relation target via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidRelationTargetWarning('1', '2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditRelationsPage.clickRelationDeleteButtonByIndices('test:relation1', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid relation target via configuration editor', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidRelationTargetWarning('1', '2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField('test:relation1');
        await ConfigurationPage.clickContextMenuEditOption();
        await CategoryPickerPage.clickSelectCategory('Trench', 'Operation', 'target-category-picker-container');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
