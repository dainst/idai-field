import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { WarningsModalPage } from './warnings-modal.page';
import { DeleteModalPage } from './delete-modal.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { SelectModalPage } from './select-modal.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createUnconfiguredCategoryWarnings } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/unconfigured category', () => {

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


    test('solve single warning for unconfigured category via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1', '2'], 'CustomCategory');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfigurierte Kategorie Test:CustomCategory']);

        await WarningsModalPage.clickDeleteResourceButton(0);
        await DeleteModalPage.typeInConfirmValue('1');
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for unconfigured category via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1', '2'], 'CustomCategory');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteResourceButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmValue('Test:CustomCategory');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });

    
    test('solve single warning for unconfigured category by selecting new category in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1', '2'], 'CustomCategory');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickSelectNewCategoryButton(0);
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await SelectModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getFieldName(0, 0)).toBe('Kategorie');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toBe('Erdbefund');
    });


    test('disable multiple switch if single resource is affected by unconfigured category warning', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1'], 'CustomCategory');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickSelectNewCategoryButton(0);
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await expect(SelectModalPage.getMultipleSwitch()).toBeDisabled();
        await SelectModalPage.clickCancelButton();

        await WarningsModalPage.clickDeleteResourceButton(0);
        await expect(DeleteModalPage.getMultipleSwitch()).toBeDisabled();
        await DeleteModalPage.clickCancelButton();

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for unconfigured category by selecting new category in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1', '2'], 'CustomCategory');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickSelectNewCategoryButton(0);
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await SelectModalPage.clickMultipleSwitch();
        await SelectModalPage.clickConfirmButton();
        
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getFieldName(0, 0)).toBe('Kategorie');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toBe('Erdbefund');

        await ResourcesPage.clickSelectResource('2');
        expect(await FieldsViewPage.getFieldName(0, 0)).toBe('Kategorie');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toBe('Erdbefund');
    });
});
