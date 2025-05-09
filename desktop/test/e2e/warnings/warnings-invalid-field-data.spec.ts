import { Field } from 'idai-field-core';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { DeleteModalPage } from './delete-modal.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { ConvertFieldDataModalPage } from './convert-field-data-modal.page';
import { SelectModalPage } from './select-modal.page';
import { createField, expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createInvalidFieldDataWarnings } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 * @author Lisa Steinmann
 */
test.describe('warnings/invalid field data --', () => {

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


    test('solve warning for invalid field data via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field', 'Text', Field.InputType.INT);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:field');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid field data via editing in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field', 'Text', Field.InputType.INT);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültige Daten im Feld test:field']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:field');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve single warning for invalid field data via conversion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'true', Field.InputType.BOOLEAN);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);

        await WarningsModalPage.clickConvertFieldDataButton(0);
        await ConvertFieldDataModalPage.clickConfirmConversionButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('disable multiple switch if single resource is affected by invalid field data warning', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field2', 'true', Field.InputType.BOOLEAN);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await expect(DeleteModalPage.getMultipleSwitch()).toBeDisabled();
        await DeleteModalPage.clickCancelButton();

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('Kurzbeschreibung');
        await expect(SelectModalPage.getMultipleSwitch()).toBeDisabled();
        await SelectModalPage.clickCancelButton();

        await WarningsModalPage.clickConvertFieldDataButton(0);
        await expect(ConvertFieldDataModalPage.getMultipleSwitch()).toBeDisabled();
        await ConvertFieldDataModalPage.clickCancelButton();

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for invalid field data via conversion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'true', Field.InputType.BOOLEAN);
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickConvertFieldDataButton(0);
        await ConvertFieldDataModalPage.clickMultipleSwitch();
        await ConvertFieldDataModalPage.clickConfirmConversionButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('do not show conversion button in warnings modal if conversion of invalid field data is not possible',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field', 'Text', Field.InputType.INT);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await waitForNotExist(await WarningsModalPage.getConvertFieldDataButton(0));

        await WarningsModalPage.clickCloseButton();
    });


    test('solve single warning for invalid field data by selecting new field in warnings modal', async () => {

        await navigateTo('configuration');
        await createField('newField', Field.InputType.INPUT, undefined, true);
        await NavbarPage.clickCloseNonResourcesTab();

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'Text', Field.InputType.INT);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('test:newField');
        await SelectModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getFieldName(0, 1)).toBe('test:newField');
        expect(await FieldsViewPage.getFieldValue(0, 1)).toBe('Text');
    });


    test('solve multiple warnings for invalid field data by selecting new field in warnings modal', async () => {

        await navigateTo('configuration');
        await createField('newField', Field.InputType.INPUT, undefined, true);
        await NavbarPage.clickCloseNonResourcesTab();

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'Text', Field.InputType.INT);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);

        await WarningsModalPage.clickSelectNewFieldButton(0);
        await SelectModalPage.clickSelectField('test:newField');
        await SelectModalPage.clickMultipleSwitch();
        await SelectModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getFieldName(0, 1)).toBe('test:newField');
        expect(await FieldsViewPage.getFieldValue(0, 1)).toBe('Text');

        await ResourcesPage.clickSelectResource('2');
        expect(await FieldsViewPage.getFieldName(0, 1)).toBe('test:newField');
        expect(await FieldsViewPage.getFieldValue(0, 1)).toBe('Text');
    });


    test('solve single warning for invalid field data via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'Text', Field.InputType.INT);

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);

        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for invalid field data via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'Text', Field.InputType.INT);
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmValue('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('only delete invalid data while solving multiple invalid field data warnings', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field', 'Text', Field.InputType.INT);

        await ResourcesPage.performCreateResource('3', 'place', 'test:field', '10');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmValue('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        // Check that invalid field data has been deleted in first resource
        await ResourcesPage.clickSelectResource('1');
        let fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(1);
        expect(await FieldsViewPage.getFieldName(0, 0)).toEqual('Kategorie');
        // Check that invalid field data has been deleted in second resource
        await ResourcesPage.clickSelectResource('2');
        fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(1);
        expect(await FieldsViewPage.getFieldName(0, 0)).toEqual('Kategorie');

        // Check that valid field data has not been deleted
        await ResourcesPage.clickSelectResource('3');
        fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(2);
        expect(await FieldsViewPage.getFieldName(0, 1)).toEqual('test:field');
        expect(await FieldsViewPage.getFieldValue(0, 1)).toEqual('10');
    });
});
