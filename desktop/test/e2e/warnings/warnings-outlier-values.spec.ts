import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { DeleteModalPage } from './delete-modal.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { FixOutliersModalPage } from './fix-outliers-modal.page';
import { DoceditCompositeEntryModalPage } from '../docedit/docedit-composite-entry-modal.page';
import { expectFieldValuesInGroup, expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createCompositeOutlierValuesWarnings, createDimensionOutlierValuesWarnings,
    createDropdownRangeOutlierValuesWarnings, createOutlierValuesWarnings, createParentOutlierValuesWarning,
    createProjectOutlierValuesWarning } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 * @author Lisa Steinmann
 */
test.describe('warnings/outlier values', () => {

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


    test('solve warning for outlier values via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        const outlierValues = await DoceditPage.getOutlierValues('test:field');
        expect(await outlierValues.count()).toBe(2);

        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        expect(await outlierValues.count()).toBe(0);

        await DoceditPage.clickSaveDocument();
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values by editing via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültige Werte im Feld test:field']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values with checkboxes by replacing values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field', 'checkboxes');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickCheckboxesValue(0); // 0 = "Altar"
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickCheckboxesValue(4); // 4 = "Gerät"
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', ['Altar', 'Gerät', 'Löffel']]);
    });

    
    test('solve warning for outlier values with dropdown by replacing values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field', 'dropdown');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', ['Gerät']]);
    });


    test('solve warning for outlier values by deleting values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('braun');
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());

        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('haselnuss');
        await DeleteModalPage.clickConfirmButton();
        
        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie'], ['Ort']);
    });    
    
    
    test('disable multiple switch if single resource is affected by outlier values warning', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field', 'dropdown');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        await expect(DeleteModalPage.getMultipleSwitch()).toBeDisabled();
        await DeleteModalPage.clickCancelButton();

        
        await WarningsModalPage.clickFixOutliersButton(0);
        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await expect(FixOutliersModalPage.getMultipleSwitch()).toBeDisabled();
        await FixOutliersModalPage.clickCancelButton();

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve multiple warnings for outlier values by replacing values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickCheckboxesValue(4); // 4 = "Gerät"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', ['Gerät', 'Löffel']]);
        await expectFieldValuesInGroup('2', 0, ['Kategorie', 'test:field'], ['Ort', ['Gerät', 'Löffel']]);
    });


    test('solve multiple warnings for outlier values with checkboxes but not dropdown by replacing values via warnings modal', 
        async () => {

        /* 
        Make sure that single values in dropdown fields are not replaced when attempting to replace all values 
        by selecting multiple new values via checkboxes. 
        */ 

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field', 'checkboxes');
        await createOutlierValuesWarnings(['3'], 'field', 'dropdown', 'Trench', 'Operation');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('3');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickCheckboxesValue(4); // 4 = "Gerät"
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickCheckboxesValue(0); // 0 = "Altar"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', ['Altar', 'Gerät', 'Löffel']]);
        await expectFieldValuesInGroup('2', 0, ['Kategorie', 'test:field'], ['Ort', ['Altar', 'Gerät', 'Löffel']]);
        await expectFieldValuesInGroup('3', 0, ['Kategorie', 'test:field'], ['Schnitt', ['braun']]);
    });


    test('solve multiple warnings for outlier values with checkboxes and dropdown by replacing value via warnings modal', 
        async () => {

        /* 
        Make sure that single values in dropdown fields are replaced when attempting to replace all values 
        by selecting a single new value via checkboxes. 
        */ 

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field', 'checkboxes');
        await createOutlierValuesWarnings(['2', '3'], 'field', 'dropdown', 'Trench', 'Operation');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('3');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickCheckboxesValue(4); // 4 = "Gerät"
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await expect(FixOutliersModalPage.getMultipleSwitch()).toBeDisabled();
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickCheckboxesValue(0); // 0 = "Altar"
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', ['Altar', 'Gerät']]);
        await expectFieldValuesInGroup('2', 0, ['Kategorie', 'test:field'], ['Schnitt', ['Gerät']]);
        await expectFieldValuesInGroup('3', 0, ['Kategorie', 'test:field'], ['Schnitt', ['Gerät']]);
    });
    

    test('solve multiple warnings for outlier values by deleting values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('braun');
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());

        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('haselnuss');
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.clickConfirmButton();
        
        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie'], ['Ort']);
        await expectFieldValuesInGroup('2', 0, ['Kategorie'], ['Ort']);
    });


    test('solve warning for project outlier values by editing via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createProjectOutlierValuesWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültiger Wert im Feld Bearbeiterin/Bearbeiter']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickRemoveOutlierValue('processor', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for project outlier values by replacing value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createProjectOutlierValuesWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);
        await FixOutliersModalPage.clickCheckboxesValue(0); // 0 = "Person 1"
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'Bearbeiterin/Bearbeiter'], ['Schnitt', 'Person 1']);
        
    });


    test('solve warning for project outlier values by deleting values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createProjectOutlierValuesWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie'], ['Schnitt']);
    });


    test('solve warning for project outlier values by updating project document', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createProjectOutlierValuesWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await navigateTo('editProject');
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.typeInMultiInputField('staff', 'Test');
        await DoceditPage.clickAddMultiInputEntry('staff');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for project outlier values in linked document by updating project document', async () => {

        // The project document is already linked via isMapLayerOf relation with the image document for which
        // the warning will occur.

        await waitForNotExist(await NavbarPage.getWarnings());

        await navigateTo('editProject');
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.clickDeleteMultiInputEntry('staff', 0);
        await DoceditPage.clickSaveDocument();

        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await navigateTo('editProject');
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.typeInMultiInputField('staff', 'Person 1');
        await DoceditPage.clickAddMultiInputEntry('staff');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for parent outlier values by updating parent document', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createParentOutlierValuesWarning('1', '2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve multiple warnings for parent outlier values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        
        await ResourcesPage.performCreateResource('T1', 'operation-trench');
        await ResourcesPage.openEditByDoubleClickResource('T1');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickCheckbox('campaign', 1);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.performCreateResource('T2', 'operation-trench');
        await ResourcesPage.openEditByDoubleClickResource('T2');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickHierarchyButton('T1');
        await ResourcesPage.performCreateResource('F1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('F1');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.performCreateResource('F2', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('F2');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('T2');
        await ResourcesPage.performCreateResource('F3', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('F3');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();

        await NavbarPage.clickTab('project');
        await ResourcesPage.openEditByDoubleClickResource('T1');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.openEditByDoubleClickResource('T2');
        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();

        expect(await NavbarPage.getNumberOfWarnings()).toBe('3');

        await NavbarPage.clickWarningsButton();
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('F1');
        await WarningsModalPage.clickFixOutliersButton(0);
        await FixOutliersModalPage.clickCheckboxesValue(0);
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        // The new value 'Testkampagne 2' must not be set for F3 as it is not set in the parent resource of F3
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('F3');
        await WarningsModalPage.clickCloseButton();
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test('solve warning for outlier values in dimension field via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDimensionOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        const outlierValues = await DoceditPage.getOutlierValues('test:field');
        expect(await outlierValues.count()).toBe(1);

        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        expect(await outlierValues.count()).toBe(0);

        await DoceditPage.clickSaveDocument();
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in dimension field by editing via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDimensionOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültiger Wert im Feld test:field']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in dimension field by replacing value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDimensionOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);
        await FixOutliersModalPage.clickSelectValue('Maximale Ausdehnung');
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup(
            '1', 0, ['Kategorie', 'test:field'], ['Ort', '1 cm, gemessen an Maximale Ausdehnung']
        );
    });


    test('solve warning for outlier values in dimension field by deleting value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDimensionOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', '1 cm']);
    });


    test('solve warning for outlier values in dropdownRange field via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDropdownRangeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        const outlierValues = await DoceditPage.getOutlierValues('test:field');
        expect(await outlierValues.count()).toBe(2);

        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        expect(await outlierValues.count()).toBe(0);

        await DoceditPage.clickSaveDocument();
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in dropdownRange field by editing via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDropdownRangeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Ungültige Werte im Feld test:field']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickRemoveOutlierValue('test:field', 0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in dropdownRange field by replacing value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDropdownRangeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);
        expect(await FixOutliersModalPage.getHeading()).toContain('Frühbronzezeitlich');
        await FixOutliersModalPage.clickSelectValue('Phase III');
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('Spätbronzezeitlich');
        await FixOutliersModalPage.clickSelectValue('Phase IV');
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field'], ['Ort', 'Von: Phase III, bis: Phase IV']);
    });


    test('solve warning for outlier values in dropdownRange field by deleting value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createDropdownRangeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('Frühbronzezeitlich');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie'], ['Ort']);
    });


    test('solve warning for outlier values in composite field via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createCompositeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await waitForExist(await DoceditPage.getCompositeEntryWarningIcon('test:field', 0));
        await DoceditPage.clickEditCompositeEntryButton('test:field', 0);

        const outlierValues = await DoceditCompositeEntryModalPage.getOutlierValues(0);
        expect(await outlierValues.count()).toBe(1);

        await DoceditCompositeEntryModalPage.clickRemoveOutlierValue(0, 0);
        expect(await outlierValues.count()).toBe(0);

        await DoceditCompositeEntryModalPage.clickConfirm();
        await waitForNotExist(await DoceditPage.getCompositeEntryWarningIcon('test:field', 0));

        await DoceditPage.clickSaveDocument();
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in composite field by editing via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createCompositeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickEditCompositeEntryButton('test:field', 0);
        await DoceditCompositeEntryModalPage.clickRemoveOutlierValue(0, 0);
        await DoceditCompositeEntryModalPage.clickConfirm();
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warning for outlier values in composite field by replacing value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createCompositeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);
        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 0)).toBe('subfield1');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 0)).toBe('Gerät');
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 1)).toBe('subfield2');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 1)).toBe('braun');
    });


    test('solve warning for outlier values in composite field by deleting value via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createCompositeOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('braun');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 0)).toBe('subfield2');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 0)).toBe('braun');
    });


    test('solve multiple warnings for outlier values in composite & checkboxes fields by replacing value via warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field1', 'checkboxes');
        await createCompositeOutlierValuesWarnings(['3', '4'], 'field2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('4');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        // will solve both the checkbox and dropdowns containing 'braun'
        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickCheckboxesValue(4); // 4 = "Gerät"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickCheckboxesValue(10); // 10 = "Löffel"
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie', 'test:field1'], ['Ort', ['Gerät', 'Löffel']]);
        await expectFieldValuesInGroup('2', 0, ['Kategorie', 'test:field1'], ['Ort', ['Gerät', 'Löffel']]);

        for (let identifier of ['3', '4']) {
            await ResourcesPage.clickSelectResource(identifier);
            expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 0)).toBe('subfield1');
            expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 0)).toBe('Gerät');
            expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 1)).toBe('subfield2');
            expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 1)).toBe('braun');
        }
    });

  
    test('solve multiple warnings for outlier values in composite & checkboxes fields by deleting value via warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field1', 'checkboxes');
        await createCompositeOutlierValuesWarnings(['3', '4'], 'field2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('4');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteOutliersButton(0);
        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('braun');
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.clickConfirmButton();
        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());

        expect(await DeleteModalPage.getHeading('delete-outliers')).toContain('haselnuss');
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getDeletionInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        await expectFieldValuesInGroup('1', 0, ['Kategorie'], ['Ort']);
        await expectFieldValuesInGroup('2', 0, ['Kategorie'], ['Ort']);

        for (let identifier of ['3', '4']) {
            await ResourcesPage.clickSelectResource(identifier);
            expect(await FieldsViewPage.getCompositeSubfieldName(0, 1, 0, 0)).toBe('subfield2');
            expect(await FieldsViewPage.getCompositeSubfieldValue(0, 1, 0, 0)).toBe('braun');
        }
    });
});
