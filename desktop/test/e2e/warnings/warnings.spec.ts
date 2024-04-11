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
import { DeleteModalPage } from './delete-modal.page';
import { ManageValuelistsModalPage } from '../configuration/manage-valuelists-modal.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { AddCategoryFormModalPage } from '../configuration/add-category-form-modal.page';
import { FixOutliersModalPage } from './fix-outliers-modal.page';
import { ConvertFieldDataModalPage } from './convert-field-data-modal.page';
import { DoceditCompositeEntryModalPage } from '../docedit/docedit-composite-entry-modal.page';
import { SelectModalPage } from './select-modal.page';

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


    async function createUnconfiguredCategoryWarnings(resourceIdentifiers: string[], categoryName: string) {

        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('trench');
        await createCategory(categoryName);

        const completeCategoryName: string = 'Test:' + categoryName;

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'feature-' + completeCategoryName);
        }

        await navigateTo('configuration');
        await ConfigurationPage.deleteCategory(completeCategoryName, 'Feature', true);
        await waitForNotExist(await CategoryPickerPage.getCategory(completeCategoryName, 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


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


    async function createInvalidFieldDataWarnings(resourceIdentifiers: string[], fieldName: string,
                                                  inputValue: string, inputType: Field.InputType) {

        await navigateTo('configuration');
        await createField(fieldName, Field.InputType.INPUT, undefined, true);

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place', completeFieldName, inputValue);
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickInputTypeSelectOption(inputType, 'field');
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
            await DoceditPage.clickCheckbox(completeFieldName, 1);
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


    async function createProjectOutlierValuesWarning(resourceIdentifier: string) {

        await navigateTo('editProject');
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.typeInMultiInputField('staff', 'Test');
        await DoceditPage.clickAddMultiInputEntry('staff');
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.performCreateResource(resourceIdentifier, 'operation-trench');
        await ResourcesPage.openEditByDoubleClickResource(resourceIdentifier);
        await DoceditPage.clickCheckbox('processor', 2);
        await DoceditPage.clickSaveDocument();

        await navigateTo('editProject');
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.clickDeleteMultiInputEntry('staff', 2);
        await DoceditPage.clickSaveDocument();
    }


    async function createDimensionOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName, 'dimension', 'position-values-edge-default');

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place');
            await ResourcesPage.openEditByDoubleClickResource(identifier);
            await DoceditPage.clickCreateNewDimensionButton(completeFieldName);
            await DoceditPage.typeInDimensionInputValue(completeFieldName, '1');
            await DoceditPage.clickDimensionMeasurementPositionOption(completeFieldName, 'Oberkante');
            await DoceditPage.clickSaveDimensionButton(completeFieldName);
            await DoceditPage.clickSaveDocument();
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('position-values-expansion-default');
        await ManageValuelistsModalPage.clickSelectValuelist('position-values-expansion-default');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createDropdownRangeOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await createField(fieldName, 'dropdownRange', 'periods-default-1');

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place');
            await ResourcesPage.openEditByDoubleClickResource(identifier);
            await DoceditPage.clickSelectOption(completeFieldName, 'Frühbronzezeitlich', 0);
            await DoceditPage.clickDropdownRangeActivateEndButton(completeFieldName);
            await DoceditPage.clickSelectOption(completeFieldName, 'Spätbronzezeitlich', 1);
            await DoceditPage.clickSaveDocument();
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('periods-meninx-1');
        await ManageValuelistsModalPage.clickSelectValuelist('periods-meninx-1');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createCompositeOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput(fieldName);
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
        
        await EditConfigurationPage.typeInNewSubfield('subfield1');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color-default');
        await ManageValuelistsModalPage.clickSelectValuelist('Wood-color-default');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.typeInNewSubfield('subfield2');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color-default');
        await ManageValuelistsModalPage.clickSelectValuelist('Wood-color-default');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        const completeFieldName: string =  'test:' + fieldName;

        await NavbarPage.clickCloseNonResourcesTab();
        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place');
            await ResourcesPage.openEditByDoubleClickResource(identifier);
            await DoceditPage.clickCreateCompositeEntry(completeFieldName);
            await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(0, 'braun');
            await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(1, 'braun');
            await DoceditCompositeEntryModalPage.clickConfirm();
            await DoceditPage.clickSaveDocument();
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickEditSubfield(0);
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-objectType-default');
        await ManageValuelistsModalPage.clickSelectValuelist('Wood-objectType-default');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirmSubfield();
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


    async function createResourceLimitWarnings(resourceIdentifiers: string[]) {

        for (let identifier of resourceIdentifiers) {
            await ResourcesPage.performCreateResource(identifier, 'place');
        }

        await navigateTo('configuration');
        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        const resourceLimit: string = (resourceIdentifiers.length - 1).toString();
        await EditConfigurationPage.typeInResourceLimit(resourceLimit);
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
    };


    async function createWarningViaAppController(message: string) {

        await navigateTo('settings');
        await sendMessageToAppController(message);
        await NavbarPage.clickCloseNonResourcesTab();
    }


    async function createCategory(categoryName: string) {
        
        await ConfigurationPage.clickCreateSubcategory('Feature');
        await AddCategoryFormModalPage.typeInSearchFilterInput(categoryName);
        await AddCategoryFormModalPage.clickCreateNewCategory();
        await EditConfigurationPage.clickConfirm();

        await waitForExist(await CategoryPickerPage.getCategory('Test:' + categoryName, 'Feature'));
        await ConfigurationPage.save();
    }


    async function createField(fieldName: string, inputType?: Field.InputType, valuelistName?: string,
                               disableMultiLanguageSupport: boolean = false) {
        
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput(fieldName);
        await AddFieldModalPage.clickCreateNewField();

        if (inputType) await EditConfigurationPage.clickInputTypeSelectOption(inputType, 'field');
        if (disableMultiLanguageSupport) await EditConfigurationPage.clickToggleMultiLanguageSlider();
        if (valuelistName) {
            await EditConfigurationPage.clickAddValuelist();
            await ManageValuelistsModalPage.typeInSearchFilterInput(valuelistName);
            await ManageValuelistsModalPage.clickSelectValuelist(valuelistName);
            await ManageValuelistsModalPage.clickConfirmSelection();
        }

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();
    }


    async function expectWarningFilterOptions(optionLabels: string[]) {

        const filterOptions = await WarningsModalPage.getFilterOptions();
        expect(await filterOptions.count()).toBe(optionLabels.length);

        for (let i = 0; i < optionLabels.length; i++) {
            expect(await WarningsModalPage.getFilterOptionText(i)).toEqual(optionLabels[i]);
        }
    }


    async function expectResourcesInWarningsModal(identifiers: string[]) {
        
        const resources = await WarningsModalPage.getResources();
        expect(await resources.count()).toBe(identifiers.length);

        for (let identifier of identifiers) {
            await waitForExist(await WarningsModalPage.getResource(identifier));
        }
    }


    async function expectSectionTitles(sectionTitles: string[]) {

        const sections = await WarningsModalPage.getSections();
        expect(await sections.count()).toBe(sectionTitles.length);

        for (let i = 0; i < sectionTitles.length; i++) {
            expect(await WarningsModalPage.getSectionTitle(i)).toEqual(sectionTitles[i]);
        }
    }


    test('solve single warning for unconfigured category via deletion in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredCategoryWarnings(['1', '2'], 'CustomCategory');

        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Unkonfigurierte Kategorie Test:CustomCategory']);

        await WarningsModalPage.clickDeleteResourceButton(0);
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
        await DeleteModalPage.typeInConfirmCategoryName('Test:CustomCategory');
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


    test('solve single warning for unconfigured field via warnings modal', async () => {

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


    test('solve multiple warnings for unconfigured fields via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnconfiguredFieldWarnings(['1', '2'], 'field');
        
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmFieldName('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
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


    test('do not show conversion button in warnings modal if conversion of invalid data is not possible', async () => {

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
        await DeleteModalPage.typeInConfirmFieldName('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('only delete invalid data while solving multiple invalid field data warnings', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'field', 'Text', Field.InputType.INT);

        await ResourcesPage.performCreateResource('2', 'place', 'test:field', '10');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickDeleteFieldDataButton(0);
        await DeleteModalPage.clickMultipleSwitch();
        await DeleteModalPage.typeInConfirmFieldName('test:field');
        await DeleteModalPage.clickConfirmButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());

        // Check that invalid field data has been deleted
        await ResourcesPage.clickSelectResource('1');
        let fields = await FieldsViewPage.getFields(0);
        expect(await fields.count()).toBe(1);
        expect(await FieldsViewPage.getFieldName(0, 0)).toEqual('Kategorie');

        // Check that valid field data has not been deleted
        await ResourcesPage.clickSelectResource('2');
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


    test('solve warning for outlier values by replacing values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickSelectValue('Löffel');
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
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
    });


    test('solve multiple warnings for outlier values by replacing values via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1', '2'], 'field');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickSelectValue('Löffel');
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
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
        await FixOutliersModalPage.clickSelectValue('Person 1');
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
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
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 0, 0, 0)).toBe('subfield1');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 0, 0, 0)).toBe('Gerät');
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 0, 0, 1)).toBe('subfield2');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 0, 0, 1)).toBe('braun');
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
        expect(await FieldsViewPage.getCompositeSubfieldName(0, 0, 0, 0)).toBe('subfield2');
        expect(await FieldsViewPage.getCompositeSubfieldValue(0, 0, 0, 0)).toBe('braun');
    });


    test('solve multiple warnings for outlier values in composite & checkboxes fields by replacing value via warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field1');
        await createCompositeOutlierValuesWarnings(['2', '3'], 'field2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('3');

        await NavbarPage.clickWarningsButton();
        await WarningsModalPage.clickFixOutliersButton(0);

        expect(await FixOutliersModalPage.getHeading()).toContain('braun');
        await FixOutliersModalPage.clickSelectValue('Gerät');
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();
        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());

        expect(await FixOutliersModalPage.getHeading()).toContain('haselnuss');
        await FixOutliersModalPage.clickSelectValue('Löffel');
        await FixOutliersModalPage.clickMultipleSwitch();
        await FixOutliersModalPage.clickConfirmReplacementButton();

        await waitForNotExist(await WarningsModalPage.getFixingDataInProgressModal());
        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve multiple warnings for outlier values in composite & checkboxes fields by deleting value via warnings modal',
            async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createOutlierValuesWarnings(['1'], 'field1');
        await createCompositeOutlierValuesWarnings(['2', '3'], 'field2');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('3');

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
    });


    test('solve warning for missing relation targets via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createMissingRelationTargetWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Fehlende Zielressource der Relation Liegt in']);

        await WarningsModalPage.clickCleanUpRelationButton(0);
        await WarningsModalPage.clickConfirmCleanUpInModalButton();

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
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Fehlendes Präfix im Feld Bezeichner']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for non-unique identifiers via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createNonUniqueIdentifierWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await ResourcesPage.openEditByDoubleClickResource('1', 0);
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for non-unique identifiers via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createNonUniqueIdentifierWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        expect(await (await WarningsModalPage.getResources()).count()).toBe(2);
        expect(await (await WarningsModalPage.getResource('1')).count()).toBe(2);
        await expectSectionTitles(['Uneindeutiger Bezeichner']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve conflict via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createConflict');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickSelectGroup('conflicts');
        await DoceditPage.clickSolveConflictButton();
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve conflict via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createConflict');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Konflikt']);

        await WarningsModalPage.clickSolveConflictButton(0);
        await DoceditPage.clickSolveConflictButton();
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for exceeded resource limit via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createResourceLimitWarnings(['1', '2']);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await ResourcesPage.clickOpenContextMenu('1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('show warnings for exceeded resource limit in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createResourceLimitWarnings(['1', '2']);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Ressourcenlimit für Kategorie Ort überschritten']);

        await WarningsModalPage.clickCloseButton();
    });


    test('filter resources in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'invalidField', 'Text', Field.InputType.INT);
        await createUnconfiguredFieldWarnings(['2', '3'], 'unconfiguredField');
        await createOutlierValuesWarnings(['4', '5', '6'], 'outliersField');
        await createMissingIdentifierPrefixWarning('7');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('7');

        await NavbarPage.clickWarningsButton();
        await expectWarningFilterOptions([
            'Alle (7)',
            'Unkonfigurierte Felder (2)',
            'Ungültige Felddaten (1)',
            'Nicht in Werteliste enthaltene Werte (3)',
            'Fehlende Bezeichner-Präfixe (7)'
        ]);
        
        await expectResourcesInWarningsModal(['1', '2', '3', '4', '5', '6', '7']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');
        await expectSectionTitles([
            'Ungültige Daten im Feld test:invalidField',
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickResource('2');
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('2');
        await expectSectionTitles([
            'Unkonfiguriertes Feld test:unconfiguredField',
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickFilterOption('unconfiguredFields:exist');
        await expectResourcesInWarningsModal(['2', '3']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('2');
        await expectSectionTitles(['Unkonfiguriertes Feld test:unconfiguredField']);

        await WarningsModalPage.clickFilterOption('outliers:exist');
        await expectResourcesInWarningsModal(['4', '5', '6']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('4');
        await expectSectionTitles(['Ungültige Werte im Feld test:outliersField']);

        await WarningsModalPage.clickFilterOption('invalidFields:exist');
        await expectResourcesInWarningsModal(['1']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');
        await expectSectionTitles(['Ungültige Daten im Feld test:invalidField']);
        
        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:invalidField');
        await DoceditPage.clickSaveDocument();

        await expectWarningFilterOptions([
            'Alle (7)',
            'Unkonfigurierte Felder (2)',
            'Nicht in Werteliste enthaltene Werte (3)',
            'Fehlende Bezeichner-Präfixe (7)'
        ]);

        await expectResourcesInWarningsModal(['1', '2', '3', '4', '5', '6', '7']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');

        await expectSectionTitles([
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickCloseButton();
    });

});
