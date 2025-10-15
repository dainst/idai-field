import { NavbarPage } from '../navbar.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { WarningsModalPage } from './warnings-modal.page';
import { DeleteModalPage } from './delete-modal.page';
import { SelectModalPage } from './select-modal.page';
import { expectFieldValuesInGroup, expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createUnconfiguredFieldWarnings, createUnconfiguredRelationFieldWarnings } from './create-warnings';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { ResourcesPage } from '../resources/resources.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 * @author Lisa Steinmann
 */
test.describe('warnings/unconfigured field', () => {

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


    test('solve single warning for unconfigured field via selecting new field in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfiguriertes Feld test:field']);

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('Kurzbeschreibung');
        await SelectModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'Kurzbeschreibung'], ['Ort', 'Text']);
    });


    test('solve multiple warnings for unconfigured fields via selecting new field in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('Kurzbeschreibung');
        await SelectModalPage.clickMultipleSwitch();
        await SelectModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'Kurzbeschreibung'], ['Ort', 'Text']);
        await expectFieldValuesInGroup('2', 0, ['Kategorie', 'Kurzbeschreibung'], ['Ort', 'Text']);
    });


    test('solve single warning for unconfigured field via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfiguriertes Feld test:field']);

        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for unconfigured fields via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmValue('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('disable multiple switch if single resource is affected by unconfigured field warning', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1'], 'field');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await expect(DeleteModalPage.getMultipleSwitch()).toBeDisabled();
        await DeleteModalPage.clickCancelButton();

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('Kurzbeschreibung');
        await expect(SelectModalPage.getMultipleSwitch()).toBeDisabled();
        await SelectModalPage.clickCancelButton();

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve single warning for unconfigured relation field via selecting new field in warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredRelationFieldWarnings(['1', '2'], 'relation');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfiguriertes Feld test:relation']);

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('isAbove');
        await SelectModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.clickSelectResource('1');
        await FieldsViewPage.clickAccordionTab(1);
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Liegt über');
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SE0');
    });


    test('solve multiple warnings for unconfigured relation fields via selecting new field in warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredRelationFieldWarnings(['1', '2'], 'relation');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('isAbove');
        await SelectModalPage.clickMultipleSwitch();
        await SelectModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickSelectResource('1');
        await FieldsViewPage.clickAccordionTab(1);
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Liegt über');
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SE0');

        await ResourcesPage.clickSelectResource('2');
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Liegt über');
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SE0');
    });


    test('solve single warning for unconfigured relation field via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredRelationFieldWarnings(['1', '2'], 'relation');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfiguriertes Feld test:relation']);

        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for unconfigured relation fields via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredRelationFieldWarnings(['1', '2'], 'relation');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmValue('test:relation');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
