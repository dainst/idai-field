import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { WarningsModalPage } from './warnings-modal.page';
import { DeleteModalPage } from './delete-modal.page';
import { SelectModalPage } from './select-modal.page';
import { MoveModalPage } from '../widgets/move-modal.page';
import { createWarningViaAppController, expectResourcesInWarningsModal, expectSectionTitles } from './helpers';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/missing or invalid parent', () => {

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


    test('solve warning for missing or invalid parent via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createMissingOrInvalidParentWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Fehlende oder ungültige übergeordnete Ressource']);

        await WarningsModalPage.clickDeleteResourceButton(0);
        await DeleteModalPage.typeInConfirmValue('1');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for missing or invalid parent by setting new parent in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createMissingOrInvalidParentWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Fehlende oder ungültige übergeordnete Ressource']);

        await WarningsModalPage.clickSelectNewParentButton(0);
        await MoveModalPage.typeInSearchBarInput('S1');
        await MoveModalPage.clickResourceListItem('S1');

        await waitForNotExist(await MoveModalPage.getModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickHierarchyButton('S1');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
    });


    test('remove warnings for missing or invalid parent when selecting new category for parent resource', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('1', 'feature-floor');
        await ResourcesPage.clickHierarchyButton('1');
        await ResourcesPage.performCreateResource('2', 'Find');

        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('trench');
        await ConfigurationPage.deleteCategory('Floor', 'Feature', true);
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();
        await NavbarPage.clickCloseNonResourcesTab();

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');
        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        await waitForExist(await WarningsModalPage.getResource('2'));

        await WarningsModalPage.clickResource('2');
        await expectSectionTitles(['Fehlende oder ungültige übergeordnete Ressource']);

        await WarningsModalPage.clickResource('1');
        await WarningsModalPage.clickSelectNewCategoryButton(0);
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await SelectModalPage.clickConfirmButton();
        
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
