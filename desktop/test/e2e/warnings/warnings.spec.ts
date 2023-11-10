import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { AddFieldModalPage } from '../configuration/add-field-modal.page';
import { DeleteFieldDataModalPage } from './delete-field-data-modal.page';

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


    async function createUnconfiguredFieldWarning(resourceIdentifier: string, fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName);

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource(resourceIdentifier, 'place', completeFieldName, 'Text');

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuDeleteOption();
        await ConfigurationPage.clickConfirmFieldDeletionButton();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createInvalidFieldDataWarning(resourceIdentifier: string, fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName);

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource(resourceIdentifier, 'place', completeFieldName, 'Text');

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickInputTypeSelectOption('int', 'field');
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


    async function createField(fieldName: string) {
        
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput(fieldName);
        await AddFieldModalPage.clickCreateNewField();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();
    }


    test('solve single warning for unconfigured field via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarning('1', 'field');
        await createUnconfiguredFieldWarning('2', 'field');

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
        await createUnconfiguredFieldWarning('1', 'field');
        await createUnconfiguredFieldWarning('2', 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteFieldDataModalPage.clickDeleteAllSwitch();
        await DeleteFieldDataModalPage.typeInConfirmFieldName('test:field');
        await DeleteFieldDataModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getResource('1'));
        await waitForNotExist(await WarningsModalPage.getResource('2'));

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid field data via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarning('1', 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:field');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for invalid field data via editing in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarning('1', 'field');
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
});
