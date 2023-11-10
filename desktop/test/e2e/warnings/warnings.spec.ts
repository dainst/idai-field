import { Field } from 'idai-field-core';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, sendMessageToAppController, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { AddFieldModalPage } from '../configuration/add-field-modal.page';
import { DeleteFieldDataModalPage } from './delete-field-data-modal.page';
import { ManageValuelistsModalPage } from '../configuration/manage-valuelists-modal.page';
import { FieldsViewPage } from '../widgets/fields-view.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings --', () => {

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


    async function createUnconfiguredFieldWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName);

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place', completeFieldName, 'Text');
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuDeleteOption();
        await ConfigurationPage.clickConfirmFieldDeletionButton();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createInvalidFieldDataWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName);

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place', completeFieldName, 'Text');
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickInputTypeSelectOption('int', 'field');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName, 'checkboxes', 'Wood-color-default');

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place');
            await ResourcesPage.openEditByDoubleClickResource(identifier);
            await DoceditPage.clickCheckbox(completeFieldName, 0);
            await DoceditPage.clickSaveDocument();
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-objectType-default');
        await ManageValuelistsModalPage.clickSelectValuelist('Wood-objectType-default');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createMissingIdentifierPrefixWarning(resourceIdentifier: string) {

        await ResourcesPage.performCreateResource(resourceIdentifier, 'place');

        await navigateTo('configuration');
        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.typeInIdentifierPrefix('P');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createField(fieldName: string, inputType?: Field.InputType, valuelistName?: string) {
        
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput(fieldName);
        await AddFieldModalPage.clickCreateNewField();

        if (inputType) await EditConfigurationPage.clickInputTypeSelectOption(inputType, 'field');
        if (valuelistName) {
            await EditConfigurationPage.clickAddValuelist();
            await ManageValuelistsModalPage.typeInSearchFilterInput(valuelistName);
            await ManageValuelistsModalPage.clickSelectValuelist(valuelistName);
            await ManageValuelistsModalPage.clickConfirmSelection();
        }

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();
    }


    test('solve single warning for unconfigured field via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        await waitForExist(await WarningsModalPage.getResource('2'));
        
        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(1);
        const sectionTitle: string = await WarningsModalPage.getSectionTitle(0);
        expect(sectionTitle).toContain('Unkonfiguriertes Feld');
        expect(sectionTitle).toContain('test:field');

        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));
        await waitForExist(await WarningsModalPage.getResource('2'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for unconfigured fields via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickDeleteAllSwitch();
        await DeleteFieldDataModalPage.typeInConfirmFieldName('test:field');
        await DeleteFieldDataModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid field data via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:field');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid field data via editing in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(1);
        const sectionTitle: string = await WarningsModalPage.getSectionTitle(0);
        expect(sectionTitle).toContain('Ungültige Daten im Feld');
        expect(sectionTitle).toContain('test:field');

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:field');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve single warning for invalid field data via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        await waitForExist(await WarningsModalPage.getResource('2'));

        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));
        await waitForExist(await WarningsModalPage.getResource('2'));

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for invalid field data via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1', '2'], 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickDeleteAllSwitch();
        await DeleteFieldDataModalPage.typeInConfirmFieldName('test:field');
        await DeleteFieldDataModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('only delete invalid data while solving multiple invalid field data warnings', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field');

        await ResourcesPage.performCreateResource('2', 'place', 'test:field', '10');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickDeleteAllSwitch();
        await DeleteFieldDataModalPage.typeInConfirmFieldName('test:field');
        await DeleteFieldDataModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        // Check that invalid field data has been deleted
        await ResourcesPage.clickSelectResource('1', 'info');
        let fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(1);
        expect(await FieldsViewPage.getFieldName(0, 0)).toEqual('Kategorie');

        // Check that valid field data has not been deleted
        await ResourcesPage.clickSelectResource('2', 'info');
        fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(2);
        expect(await FieldsViewPage.getFieldName(0, 1)).toEqual('test:field');
        expect(await FieldsViewPage.getFieldValue(0, 1)).toEqual('10');
    });


    test('solve warning for outlier values via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        const outlierValues = await DoceditPage.getOutlierValues('test:field');
        expect(await outlierValues.count()).toBe(1);

        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        expect(await outlierValues.count()).toBe(0);

        await DoceditPage.clickSaveDocument();
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(1);
        const sectionTitle: string = await WarningsModalPage.getSectionTitle(0);
        expect(sectionTitle).toContain('Ungültiger Wert im Feld');
        expect(sectionTitle).toContain('test:field');

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for missing identifier prefix via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createMissingIdentifierPrefixWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for missing identifier prefix via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createMissingIdentifierPrefixWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await waitForExist(await WarningsModalPage.getResource('1'));
        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(1);
        expect(await WarningsModalPage.getSectionTitle(0)).toContain('Fehlendes Präfix');

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for non-unique identifiers via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await sendMessageToAppController('createNonUniqueIdentifierWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        expect(await (await WarningsModalPage.getResource('1')).count()).toBe(2);
        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(1);
        const sectionTitle = await WarningsModalPage.getSectionTitle(0);
        expect(sectionTitle).toContain('Uneindeutiger Bezeichner');

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
