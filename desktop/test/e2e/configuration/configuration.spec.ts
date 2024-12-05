import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { getText, navigateTo, pause, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from './configuration.page';
import { AddCategoryFormModalPage } from './add-category-form-modal.page';
import { EditConfigurationPage } from './edit-configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { DoceditPage } from '../docedit/docedit.page';
import { AddFieldModalPage } from './add-field-modal.page';
import { AddGroupModalPage } from './add-group-modal.page';
import { ManageValuelistsModalPage } from './manage-valuelists-modal.page';
import { DoceditCompositeEntryModalPage } from '../docedit/docedit-composite-entry-modal.page';
import { MoveModalPage } from '../widgets/move-modal.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { FieldsViewPage } from '../widgets/fields-view.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('configuration --', () => {

    async function createSubfieldAndValuelist(subfieldName: string, valuelistName: string, valueName: string) {

        await EditConfigurationPage.typeInNewSubfield(subfieldName);
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');

        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput(valuelistName);
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue(valueName);
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await EditConfigurationPage.clickConfirmSubfield();
    }


    async function addValueToValuelist(subfieldIndex: number, newValueName: string) {

        await EditConfigurationPage.clickEditSubfield(subfieldIndex);
        await EditConfigurationPage.clickEditValuelist();
        await EditConfigurationPage.typeInNewValue(newValueName);
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await EditConfigurationPage.clickConfirmSubfield();
    };


    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
    });


    test.afterAll(async () => {

        await stop();
    });
    

    test('apply categories filter', async () => {

        await ConfigurationPage.clickSelectCategoriesFilter('project');
        expect(await (await CategoryPickerPage.getCategories()).count()).toBe(6);
        await waitForExist(await CategoryPickerPage.getCategory('Project'));
        await waitForExist(await CategoryPickerPage.getCategory('Operation'));
        await waitForExist(await CategoryPickerPage.getCategory('Trench', 'Operation'));
        await waitForExist(await CategoryPickerPage.getCategory('Building', 'Operation'));
        await waitForExist(await CategoryPickerPage.getCategory('Survey', 'Operation'));
        await waitForExist(await CategoryPickerPage.getCategory('Place'));

        await ConfigurationPage.clickSelectCategoriesFilter('trench');
        await waitForNotExist(await CategoryPickerPage.getCategory('Project'));
        await waitForExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForExist(await CategoryPickerPage.getCategory('Find'));

        await ConfigurationPage.clickSelectCategoriesFilter('images');
        await waitForNotExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForExist(await CategoryPickerPage.getCategory('Image'));

        await ConfigurationPage.clickSelectCategoriesFilter('types');
        await waitForNotExist(await CategoryPickerPage.getCategory('Image'));
        await waitForExist(await CategoryPickerPage.getCategory('TypeCatalog'));
        await waitForExist(await CategoryPickerPage.getCategory('Type'));
    });


    test('delete category', async () => {

        await ConfigurationPage.deleteCategory('Floor', 'Feature');
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
    });


    test('add category from library', async () => {

        await ConfigurationPage.clickCreateSubcategory('Feature');
        await waitForNotExist(await AddCategoryFormModalPage.getCategoryHeader('Floor'));
        await waitForNotExist(await AddCategoryFormModalPage.getSelectFormButton('Floor'));
        await waitForNotExist(await AddCategoryFormModalPage.getSelectFormButton('Floor:default'));
        await AddCategoryFormModalPage.clickCancel();

        await ConfigurationPage.deleteCategory('Floor', 'Feature');
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
        
        await ConfigurationPage.clickCreateSubcategory('Feature');
        await waitForExist(await AddCategoryFormModalPage.getCategoryHeader('Floor'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Floor'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Floor:default'));

        await AddCategoryFormModalPage.typeInSearchFilterInput('Floor:default');
        await waitForExist(await AddCategoryFormModalPage.getCategoryHeader('Floor'));
        await waitForNotExist(await AddCategoryFormModalPage.getSelectFormButton('Floor'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Floor:default'));

        await AddCategoryFormModalPage.typeInSearchFilterInput('Floor');
        await waitForExist(await AddCategoryFormModalPage.getCategoryHeader('Floor'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Floor'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Floor:default'));

        await AddCategoryFormModalPage.clickSelectForm('Floor:default');
        await AddCategoryFormModalPage.clickConfirmSelection();
        await waitForExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
    });


    test('add custom category', async () => {

        await ConfigurationPage.clickCreateSubcategory('Feature');
        await AddCategoryFormModalPage.typeInSearchFilterInput('NewCategory');
        await AddCategoryFormModalPage.clickCreateNewCategory();

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neue Kategorie', 'category');
        await EditConfigurationPage.clickConfirm();

        await waitForExist(await CategoryPickerPage.getCategory('Test:NewCategory', 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForExist(await CategoryPickerPage.getCategory('Test:NewCategory', 'Feature'));
        expect((await CategoryPickerPage.getCategoryLabel('Test:NewCategory', 'Feature'))).toEqual('Neue Kategorie');
    });


    test('index resources of newly created custom category', async () => {

        await ConfigurationPage.clickCreateSubcategory('Feature');
        await AddCategoryFormModalPage.typeInSearchFilterInput('NewCategory');
        await AddCategoryFormModalPage.clickCreateNewCategory();
        await EditConfigurationPage.clickConfirm();

        await waitForExist(await CategoryPickerPage.getCategory('Test:NewCategory', 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('Feature1', 'feature-test-newcategory');
        await ResourcesPage.performCreateResource('Find1', 'find');

        await ResourcesPage.clickOpenContextMenu('Find1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('Feature');
        const labels = await MoveModalPage.getResourceIdentifierLabels();
        expect(await getText(labels.nth(0))).toEqual('Feature1');

        await MoveModalPage.clickCancel();
    });


    test('swap category form', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickSelectGroup('properties');
        await waitForExist(await ConfigurationPage.getField('gazId'));
        await waitForExist(await ConfigurationPage.getField('description'));
        expect(await (await ConfigurationPage.getFields()).count()).toBeGreaterThan(1);

        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuSwapOption();
        await waitForExist(await AddCategoryFormModalPage.getCategoryHeader('Place'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Place'));
        await waitForNotExist(await AddCategoryFormModalPage.getSelectFormButton('Place:default'));
        await AddCategoryFormModalPage.clickSelectForm('Place');
        await AddCategoryFormModalPage.clickConfirmSelection();
        await ConfigurationPage.clickSelectGroup('properties');
        await waitForExist(await ConfigurationPage.getField('gazId'));
        await waitForNotExist(await ConfigurationPage.getField('description'));
        expect(await (await ConfigurationPage.getFields()).count()).toBe(1);
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.clickGotoPropertiesTab();
        await waitForExist(await DoceditPage.getField('gazId'));
        await waitForNotExist(await DoceditPage.getField('description'));
        await DoceditPage.clickCloseEdit();
    });


    test('edit category label', async () => {

        expect(await CategoryPickerPage.getCategoryLabel('Place')).toEqual('Ort');
        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.typeInTranslation(0, 0, 'Editierte Kategorie', 'category');
        await EditConfigurationPage.clickConfirm();
        expect(await CategoryPickerPage.getCategoryLabel('Place')).toEqual('Editierte Kategorie');
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        expect(await CategoryPickerPage.getCategoryLabel('Place')).toEqual('Editierte Kategorie');

        await navigateTo('configuration');
        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickResetTranslation(0, 0);
        await EditConfigurationPage.clickConfirm();
        expect(await CategoryPickerPage.getCategoryLabel('Place')).toEqual('Ort');
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        expect(await CategoryPickerPage.getCategoryLabel('Place')).toEqual('Ort');
    });


    test('set identifier prefix', async () => {

        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.typeInIdentifierPrefix('PL-');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        expect(await DoceditPage.getIdentifierPrefix()).toEqual('PL-');
        await DoceditPage.typeInInputField('identifier', '123');
        await DoceditPage.clickSaveDocument();
        await waitForExist(await ResourcesPage.getListItemEl('PL-123'));
    });


    test('show warning for invalid identifier in docedit modal after setting identifier prefix', async () => {

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', '123');
        await DoceditPage.clickSaveDocument();
        await waitForExist(await ResourcesPage.getListItemEl('123'));

        await navigateTo('configuration');
        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.typeInIdentifierPrefix('PL-');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await waitForExist(await ResourcesPage.getListItemEl('123'));
        await ResourcesPage.openEditByDoubleClickResource('123');
        await waitForExist(await DoceditPage.getInvalidIdentifierInfo());
        expect(await DoceditPage.getIdentifierPrefix()).toEqual('PL-');
        expect(await DoceditPage.getIdentifierInputFieldValue()).toEqual('');
        await DoceditPage.typeInInputField('identifier', '123');
        await DoceditPage.clickSaveDocument();
        await waitForExist(await ResourcesPage.getListItemEl('PL-123'));
    });


    test('set resource limit', async () => {

        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.typeInResourceLimit('2');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('1', 'place');

        await ResourcesPage.clickCreateResource();
        await waitForExist(await ResourcesPage.getCategoryOption('place'));

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickDuplicateDocument();
        await DoceditPage.typeInNumberOfDuplicates('2');
        await waitForExist(await DoceditPage.getConfirmDuplicateButton(true));
        await DoceditPage.typeInNumberOfDuplicates('1');
        await waitForNotExist(await DoceditPage.getConfirmDuplicateButton(true));
        await DoceditPage.clickConfirmDuplicateInModal();

        await ResourcesPage.clickCreateResource();
        await waitForExist(await ResourcesPage.getCategoryOption('operation-trench'));
        await waitForNotExist(await ResourcesPage.getCategoryOption('place'));
    });


    test('add library field as custom field', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await waitForExist(AddFieldModalPage.getSelectFieldButton('processor'));
        await waitForExist(AddFieldModalPage.getSelectFieldButton('area'));
        
        await AddFieldModalPage.typeInSearchFilterInput('area');
        await waitForNotExist(AddFieldModalPage.getSelectFieldButton('processor'));
        await waitForExist(AddFieldModalPage.getSelectFieldButton('area'));
        
        await AddFieldModalPage.clickSelectField('area');
        await AddFieldModalPage.clickConfirmSelection();
        await waitForExist(ConfigurationPage.getField('area'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await waitForExist(await DoceditPage.getField('area'));
        await DoceditPage.clickCloseEdit();
    });


    test('add newly created field as custom field', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('newField');
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neues Feld', 'field');
        await EditConfigurationPage.clickConfirm();
        await waitForExist(ConfigurationPage.getField('test:newField'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await waitForExist(await DoceditPage.getField('test:newField'));
        expect(await DoceditPage.getFieldLabel('test:newField')).toEqual('Neues Feld');
        await DoceditPage.clickCloseEdit();
    });


    test('inherit custom field from parent form', async () => {

        // Create custom field
        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('dimension');
        await ConfigurationPage.clickAddFieldButton();        
        await AddFieldModalPage.clickSelectField('dimensionDiameter');
        await AddFieldModalPage.clickConfirmSelection();
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));

        // Inherit custom field in existing subcategory
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await ConfigurationPage.clickSelectGroup('dimension');
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));

        // Inherit custom field in newly created subcategory
        await ConfigurationPage.clickCreateSubcategory('Feature');
        await AddCategoryFormModalPage.typeInSearchFilterInput('NewCategory');
        await AddCategoryFormModalPage.clickCreateNewCategory();
        await EditConfigurationPage.clickConfirm();
        await waitForExist(await ConfigurationPage.getCategory('Test:NewCategory'));
        await ConfigurationPage.clickSelectGroup('dimension');
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));

        // Still inherit custom field after swapping category form
        await CategoryPickerPage.clickOpenContextMenu('Layer', 'Feature');
        await ConfigurationPage.clickContextMenuSwapOption();
        await AddCategoryFormModalPage.clickSelectForm('Layer');
        await AddCategoryFormModalPage.clickConfirmSelection();
        await AddCategoryFormModalPage.typeInConfirmSwappingCategoryFormInput('Layer');
        await AddCategoryFormModalPage.clickConfirmSwappingCategoryForm();
        await waitForExist(await ConfigurationPage.getCategory('Layer'));
        await ConfigurationPage.clickSelectGroup('dimension');
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.clickGotoDimensionTab();
        await waitForExist(await DoceditPage.getField('dimensionDiameter'));
        await DoceditPage.clickCloseEdit();

        // Remove custom field
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('dimension');
        await ConfigurationPage.clickOpenContextMenuForField('dimensionDiameter');
        await ConfigurationPage.clickContextMenuDeleteOption();
        await ConfigurationPage.clickConfirmFieldDeletionButton();
        await waitForNotExist(ConfigurationPage.getField('dimensionDiameter'));

        // Do not inherit removed custom field in subcategory
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await ConfigurationPage.clickSelectGroup('dimension');
        await waitForNotExist(ConfigurationPage.getField('dimensionDiameter'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.clickGotoDimensionTab();
        await waitForNotExist(await DoceditPage.getField('dimensionDiameter'));
        await DoceditPage.clickCloseEdit();
    });


    test('reset custom changes when swapping category form', async () => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.clickSelectField('dimensionDiameter');
        await AddFieldModalPage.clickConfirmSelection();
        await waitForExist(ConfigurationPage.getField('identifier'));
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));

        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await waitForExist(await ConfigurationPage.getCategory('Layer'));
        await waitForExist(ConfigurationPage.getField('dimensionDiameter'));

        await CategoryPickerPage.clickOpenContextMenu('Feature');
        await ConfigurationPage.clickContextMenuSwapOption();
        await AddCategoryFormModalPage.clickSelectForm('Feature');
        await AddCategoryFormModalPage.clickConfirmSelection();
        await AddCategoryFormModalPage.typeInConfirmSwappingCategoryFormInput('Feature');
        await AddCategoryFormModalPage.clickConfirmSwappingCategoryForm();
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(ConfigurationPage.getField('identifier'));
        await waitForNotExist(ConfigurationPage.getField('dimensionDiameter'));

        await CategoryPickerPage.clickSelectCategory('Layer', 'Feature');
        await waitForExist(await ConfigurationPage.getCategory('Layer'));
        await waitForNotExist(ConfigurationPage.getField('dimensionDiameter'));
        await ConfigurationPage.save();
    });


    test('do not allow creating custom field of same name for child and parent category', async () => {

        await CategoryPickerPage.clickSelectCategory('Pottery', 'Find');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('newField');
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.clickConfirm();
        await waitForExist(ConfigurationPage.getField('test:newField'));
        await ConfigurationPage.save();

        await CategoryPickerPage.clickSelectCategory('Find');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('new');
        await waitForExist(await AddFieldModalPage.getCreateNewFieldButton());
        await AddFieldModalPage.typeInSearchFilterInput('newField');
        await waitForNotExist(await AddFieldModalPage.getCreateNewFieldButton());
        await AddFieldModalPage.clickCancel();
    });


    test('add custom group', async () => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickAddGroupButton();
        await AddGroupModalPage.typeInSearchFilterInput('newGroup');
        await AddGroupModalPage.clickCreateNewGroup();

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neue Gruppe', 'group');
        await EditConfigurationPage.clickConfirm();
        await waitForExist(await ConfigurationPage.getGroup('test:newGroup'));
        
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddGroupButton();
        await AddGroupModalPage.typeInSearchFilterInput('newGroup');
        await AddGroupModalPage.clickSelectGroup('test:newGroup');
        await AddGroupModalPage.clickConfirmSelection();
        await waitForExist(await ConfigurationPage.getActiveGroup('test:newGroup'));

        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.clickSelectField('dimensionDiameter');
        await AddFieldModalPage.clickConfirmSelection();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        expect(await DoceditPage.getGroupLabel('test:newGroup')).toEqual('Neue Gruppe');
        await DoceditPage.clickSelectGroup('test:newGroup');
        await waitForExist(await DoceditPage.getField('dimensionDiameter'));
        await DoceditPage.clickCloseEdit();
    });


    test('hide field', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickSelectGroup('properties');
        await ConfigurationPage.clickOpenContextMenuForField('description');
        await ConfigurationPage.clickContextMenuEditOption();    
        await EditConfigurationPage.clickToggleHiddenSlider();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.clickSelectGroup('properties');
        await waitForExist(await DoceditPage.getField('description'));
        await waitForNotExist(await DoceditPage.getFieldFormGroup('description'));
        
        await DoceditPage.clickCloseEdit();
    });


    test('hide parent field', async () => {

        await CategoryPickerPage.clickSelectCategory('Operation');
        await ConfigurationPage.clickSelectGroup('properties');
        await ConfigurationPage.clickOpenContextMenuForField('description');
        await ConfigurationPage.clickContextMenuEditOption();    
        await EditConfigurationPage.clickToggleHiddenSlider();
        await EditConfigurationPage.clickConfirm();
        
        await CategoryPickerPage.clickSelectCategory('Trench', 'Operation');
        await ConfigurationPage.clickSelectGroup('properties');
        expect((await(await ConfigurationPage.getField('description')).getAttribute('class')))
            .toContain('hidden');

        await CategoryPickerPage.clickSelectCategory('Operation');
        await ConfigurationPage.clickSelectGroup('properties');
        await ConfigurationPage.clickOpenContextMenuForField('description');
        await ConfigurationPage.clickContextMenuEditOption();    
        await EditConfigurationPage.clickToggleHiddenSlider();
        await EditConfigurationPage.clickConfirm();
        
        await CategoryPickerPage.clickSelectCategory('Trench', 'Operation');
        await ConfigurationPage.clickSelectGroup('properties');
        expect((await(await ConfigurationPage.getField('description')).getAttribute('class')))
            .not.toContain('hidden');

        await ConfigurationPage.save();
    });


    test('swap valuelist', async () => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('time');
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('Archaisch');

        await ConfigurationPage.clickOpenContextMenuForField('period');
        await ConfigurationPage.clickContextMenuEditOption();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('periods-default-1');
        expect(await EditConfigurationPage.getValue(0)).toEqual('Archaisch');
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('colors-default-1');
        await ManageValuelistsModalPage.clickSelectValuelist('colors-default-1');
        await ManageValuelistsModalPage.clickConfirmSelection();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('colors-default-1');
        expect(await EditConfigurationPage.getValue(0)).toEqual('beige');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('beige');
        await ConfigurationPage.save();
    });


    test('create new valuelist via field editor', async () => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('time');
        await ConfigurationPage.clickOpenContextMenuForField('period');
        await ConfigurationPage.clickContextMenuEditOption();

        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('new-valuelist');
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue('newValue');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('test:new-valuelist');
        expect(await EditConfigurationPage.getValue(0)).toEqual('newValue');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('newValue');
        await ConfigurationPage.save();
    });


    test('create new valuelist via valuelist management & select it in field editor', async () => {

        await navigateTo('valuelists');
        await ManageValuelistsModalPage.typeInSearchFilterInput('new-valuelist');
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue('newValue');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:new-valuelist'));
        await ManageValuelistsModalPage.clickCancel();

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('time');
        await ConfigurationPage.clickOpenContextMenuForField('period');
        await ConfigurationPage.clickContextMenuEditOption();

        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('test:new-valuelist');
        await ManageValuelistsModalPage.clickSelectValuelist('test:new-valuelist');
        await ManageValuelistsModalPage.clickConfirmSelection();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('test:new-valuelist');
        expect(await EditConfigurationPage.getValue(0)).toEqual('newValue');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('newValue');
        await ConfigurationPage.save();

    });


    test('filter valuelists in valuelists management', async () => {

        await navigateTo('valuelists');
        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color-custom');
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue('newValue');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();

        await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color');
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('Wood-color-default'));
        await waitForNotExist(await ManageValuelistsModalPage.getSelectValuelistButton('periods-default-1'));
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:Wood-color-custom'));
        
        await ManageValuelistsModalPage.clickFilterButton();
        await ManageValuelistsModalPage.clickToggleInUseFilter();
        await waitForNotExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:Wood-color-custom'));
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('Wood-color-default'));
        
        await ManageValuelistsModalPage.clickToggleCustomFilter();
        await waitForNotExist(await ManageValuelistsModalPage.getSelectValuelistButton('Wood-color-default'));
        await waitForNotExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:Wood-color-custom'));
        
        await ManageValuelistsModalPage.clickToggleInUseFilter();
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:Wood-color-custom'));
        await waitForNotExist(await ManageValuelistsModalPage.getSelectValuelistButton('Wood-color-default'));

        await ManageValuelistsModalPage.clickToggleCustomFilter();
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('test:Wood-color-custom'));
        await waitForExist(await ManageValuelistsModalPage.getSelectValuelistButton('Wood-color-default'));

        await ManageValuelistsModalPage.clickCancel();
        await ConfigurationPage.save();
    });


    test('extend an existing valuelist', async () => {

        await navigateTo('valuelists');
        await ManageValuelistsModalPage.typeInSearchFilterInput('periods-default-1');
        await ManageValuelistsModalPage.clickOpenContextMenu('periods-default-1');
        await ManageValuelistsModalPage.clickContextMenuExtendOption();
        await ManageValuelistsModalPage.typeInValuelistExtensionName('periods-custom');
        await ManageValuelistsModalPage.clickConfirmValuelistExtension();
        await EditConfigurationPage.typeInNewValue('A-1');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await ManageValuelistsModalPage.clickCancel();

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('time');
        await ConfigurationPage.clickOpenContextMenuForField('period');
        await ConfigurationPage.clickContextMenuEditOption();

        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('test:periods-custom');
        await ManageValuelistsModalPage.clickSelectValuelist('test:periods-custom');
        await ManageValuelistsModalPage.clickConfirmSelection();
        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('test:periods-custom');
        expect(await EditConfigurationPage.getValue(0)).toEqual('A-1');
        expect(await EditConfigurationPage.getValue(1)).toEqual('Archaisch');

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('A-1');
        expect(await ConfigurationPage.getValue(1)).toEqual('Archaisch');
        await ConfigurationPage.save();
    });


    test('use valuelist for short description', async () => {

        await CategoryPickerPage.clickSelectCategory('Operation');
        await ConfigurationPage.clickOpenContextMenuForField('shortDescription');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'field');
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('test-list');
        await ManageValuelistsModalPage.clickCreateNewValuelist();
        await EditConfigurationPage.typeInNewValue('testValue');
        await EditConfigurationPage.clickAddValue();
        await EditConfigurationPage.typeInTranslation(0, 0, 'Value label', 'value');
        await EditConfigurationPage.clickConfirmValue();
        await EditConfigurationPage.clickConfirmValuelist();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory('operation-trench');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', 'Test trench');
        await DoceditPage.clickSelectOption('shortDescription', 'Value label');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Value label');
    });


    test('create composite field', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('compositeField');
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
        await EditConfigurationPage.typeInTranslation(0, 0, 'Kompositfeld', 'field');
        
        await EditConfigurationPage.typeInNewSubfield('subfield1');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('boolean', 'subfield');
        await EditConfigurationPage.typeInTranslation(0, 0, 'Unterfeld 1', 'subfield');
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.typeInNewSubfield('subfield2');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('input', 'subfield');
        await EditConfigurationPage.typeInTranslation(0, 0, 'Unterfeld 2', 'subfield');
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.openEditByDoubleClickResource('P1');
        await DoceditPage.clickCreateCompositeEntry('test-compositeField');
        expect(await DoceditCompositeEntryModalPage.getSubfieldLabel(0)).toEqual('Unterfeld 1');
        expect(await DoceditCompositeEntryModalPage.getSubfieldLabel(1)).toEqual('Unterfeld 2');
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(0, 'boolean'));
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(1, 'input'));

        await DoceditCompositeEntryModalPage.clickCancel();
        await DoceditPage.clickCloseEdit();
    });


    test('set conditions for subfield of composite field', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('compositeField');
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
        await EditConfigurationPage.typeInNewSubfield('subfield1');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('boolean', 'subfield');
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.typeInNewSubfield('subfield2');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
        await EditConfigurationPage.clickSelectConditionSubfield('subfield1');
        await EditConfigurationPage.clickSelectConditionValue('boolean', 0);
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('periods-default-1');
        await ManageValuelistsModalPage.clickSelectValuelist('periods-default-1');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.typeInNewSubfield('subfield3');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('input', 'subfield');
        await EditConfigurationPage.clickSelectConditionSubfield('subfield2');
        await EditConfigurationPage.clickSelectConditionValue('valuelist', 3);
        await EditConfigurationPage.clickSelectConditionValue('valuelist', 4);
        await EditConfigurationPage.clickConfirmSubfield();

        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.openEditByDoubleClickResource('P1');
        await DoceditPage.clickCreateCompositeEntry('test-compositeField');
        
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(0, 'boolean'));
        await waitForNotExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(1, 'dropdown'));
        await waitForNotExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(2, 'input'));

        await DoceditCompositeEntryModalPage.clickSubfieldBooleanRadioButton(0, 0);
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(1, 'dropdown'));

        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(1, 'Eisenzeitlich');
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(2, 'input'));
        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(1, 'Geometrisch');
        await waitForNotExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(2, 'input'));
        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(1, 'Frühbronzezeitlich');
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(2, 'input'));

        await DoceditCompositeEntryModalPage.clickSubfieldBooleanRadioButton(0, 1);
        await waitForNotExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(1, 'dropdown'));
        await waitForNotExist(await DoceditCompositeEntryModalPage.getSubfieldInputElement(2, 'input'));

        await DoceditCompositeEntryModalPage.clickCancel();
        await DoceditPage.clickCloseEdit();
    });


    test('create and edit valuelists via composite field editor', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('compositeField');
        await AddFieldModalPage.clickCreateNewField();
        await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
        await createSubfieldAndValuelist('subfield1', 'new-valuelist-1', 'value1a');
        await createSubfieldAndValuelist('subfield2', 'new-valuelist-2', 'value2a');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.openEditByDoubleClickResource('P1');
        await DoceditPage.clickCreateCompositeEntry('test-compositeField');
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldSelectOption(0, 'value1a'));
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldSelectOption(1, 'value2a'));
        
        await DoceditCompositeEntryModalPage.clickCancel();
        await DoceditPage.clickCloseEdit();

        await navigateTo('configuration');
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickOpenContextMenuForField('test-compositeField');
        await ConfigurationPage.clickContextMenuEditOption();
        await addValueToValuelist(0, 'value1b');
        await addValueToValuelist(1, 'value2b');
        await EditConfigurationPage.clickCancel();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('P2', 'place');
        await ResourcesPage.openEditByDoubleClickResource('P2');
        await DoceditPage.clickCreateCompositeEntry('test-compositeField');
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldSelectOption(0, 'value1b'));
        await waitForExist(await DoceditCompositeEntryModalPage.getSubfieldSelectOption(1, 'value2b'));

        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(0, 'value1b');
        await DoceditCompositeEntryModalPage.clickCancel();
        await DoceditPage.clickCloseEdit();
    });


    test('show updated valuelist after editing it via editor of another subfield', async () => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('compositeField');
        await AddFieldModalPage.clickCreateNewField();
        await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
        await createSubfieldAndValuelist('subfield1', 'new-valuelist', 'value1');
        
        await EditConfigurationPage.typeInNewSubfield('subfield2');
        await EditConfigurationPage.clickCreateSubfield();
        await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput('new-valuelist');
        await ManageValuelistsModalPage.clickSelectValuelist('test:new-valuelist');
        await ManageValuelistsModalPage.clickConfirmSelection();
        await EditConfigurationPage.clickConfirmSubfield();

        await addValueToValuelist(0, 'value2');
        await EditConfigurationPage.clickEditSubfield(1);
        const values = await ConfigurationPage.getValues();
        expect(await values.count()).toBe(2);
        expect(await ConfigurationPage.getValue(0)).toEqual('value1');
        expect(await ConfigurationPage.getValue(1)).toEqual('value2');

        await EditConfigurationPage.clickConfirmSubfield();
        await EditConfigurationPage.clickCancel();
    });


    test('create relation with inverse relation', async () => {

        await ConfigurationPage.createRelation('Place', 'relation1', 'Relation 1', ['Trench'], ['Operation']);
        await ConfigurationPage.createRelation('Trench', 'relation2', 'Relation 2', ['Place'], [undefined], 'Operation');
        
        await ConfigurationPage.clickOpenContextMenuForField('test:relation2');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSelectInverseRelation('test:relation1');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.performCreateResource('T1', 'operation-trench');
        await ResourcesPage.openEditByDoubleClickResource('P1');
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('test:relation1');
        await DoceditRelationsPage.typeInRelation('test:relation1', 'T1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('P1');
        expect(await FieldsViewPage.getRelationName(0, 1)).toBe('Relation 1');
        expect(await FieldsViewPage.getRelationValue(0, 0)).toBe('T1');

        await ResourcesPage.clickSelectResource('T1');
        expect(await FieldsViewPage.getRelationName(0, 1)).toBe('Relation 2');
        expect(await FieldsViewPage.getRelationValue(0, 0)).toBe('P1');
    });


    test('add & remove inverse relations automatically', async () => {

        async function expectInverseRelation(categoryName: string, relationName: string, inverseRelationLabel?: string,
                                             supercategoryName?: string) {

            await CategoryPickerPage.clickSelectCategory(categoryName, supercategoryName);
            await ConfigurationPage.clickSelectField(relationName);

            if (inverseRelationLabel) {
                expect(await ConfigurationPage.getInverseRelationLabel(relationName)).toBe(inverseRelationLabel); 
            } else {
                await waitForNotExist(await ConfigurationPage.getInverseRelation(relationName));
            }
        };

        await ConfigurationPage.createRelation(
            'Place', 'relation1', 'Relation 1', ['Trench', 'Feature', 'Sample'], ['Operation', undefined, undefined]
        );
        await ConfigurationPage.createRelation(
            'Trench', 'relation2', 'Relation 2', ['Place', 'Find'], [undefined, undefined], 'Operation'
        );
        await ConfigurationPage.addRelation('Feature', 'test:relation2', ['Place', 'Find'], [undefined, undefined]);
        await ConfigurationPage.addRelation('Find', 'test:relation1', ['Trench', 'Feature'], ['Operation', undefined]);
        await ConfigurationPage.addRelation('Sample', 'test:relation2', ['Place'], [undefined]);

        await ConfigurationPage.clickOpenContextMenuForField('test:relation2');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSelectInverseRelation('test:relation1');
        await EditConfigurationPage.clickConfirm();

        await expectInverseRelation('Place', 'test:relation1', 'Relation 2');
        await expectInverseRelation('Trench', 'test:relation2', 'Relation 1', 'Operation');
        await expectInverseRelation('Feature', 'test:relation2', 'Relation 1');
        await expectInverseRelation('Find', 'test:relation1', 'Relation 2');
        await expectInverseRelation('Sample', 'test:relation2', 'Relation 1');

        await ConfigurationPage.clickOpenContextMenuForField('test:relation2');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickSelectInverseRelation('');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save();

        await expectInverseRelation('Place', 'test:relation1', undefined);
        await expectInverseRelation('Trench', 'test:relation2', undefined, 'Operation');
        await expectInverseRelation('Feature', 'test:relation2', undefined);
        await expectInverseRelation('Find', 'test:relation1', undefined);
        await expectInverseRelation('Sample', 'test:relation2', undefined);
    });


    test('show only suitable relations in inverse relation dropdown', async () => {

        await ConfigurationPage.createRelation('Place', 'relation1', 'Relation 1', ['Trench'], ['Operation']);
        await ConfigurationPage.createRelation(
            'Trench', 'relation2', 'Relation 2', ['Feature'], [undefined], 'Operation'
        );
        
        await ConfigurationPage.clickOpenContextMenuForField('test:relation2');
        await ConfigurationPage.clickContextMenuEditOption();

        let options = await EditConfigurationPage.getInverseRelationOptions();
        expect(await options.count()).toBe(1);
        expect(await getText(await options.nth(0))).toBe('Keine Gegenrelation');

        await CategoryPickerPage.clickSelectCategory('Place', undefined, 'target-category-picker-container');

        options = await EditConfigurationPage.getInverseRelationOptions();
        expect(await options.count()).toBe(1);
        expect(await getText(await options.nth(0))).toBe('Keine Gegenrelation');

        await CategoryPickerPage.clickSelectCategory('Feature', undefined, 'target-category-picker-container');

        options = await EditConfigurationPage.getInverseRelationOptions();
        expect(await options.count()).toBe(2);
        expect(await getText(await options.nth(0))).toBe('Keine Gegenrelation');
        expect(await getText(await options.nth(1))).toBe('Relation 1');

        await EditConfigurationPage.clickCancel();
    });
});
