import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from './configuration.page';
import { AddCategoryFormModalPage } from './add-category-form-modal.page';
import { EditConfigurationPage } from './edit-configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { DoceditPage } from '../docedit/docedit.page';
import { AddFieldModalPage } from './add-field-modal.page';
import { AddGroupModalPage } from './add-group-modal.page';
import { ManageValuelistsModalPage } from './manage-valuelists-modal.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('configuration --', () => {

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


    test('delete category with existing resources & show warning for liesWithin resources', async () => {

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickSwitchHierarchyMode();
        await waitForExist(await ResourcesPage.getListItemEl('SE4'));
        
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
        await ConfigurationPage.deleteCategory('Grave', 'Feature', true);
        await waitForNotExist(await CategoryPickerPage.getCategory('Grave', 'Feature'));
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await waitForExist(await ResourcesPage.getListItemEl('SE3'));
        await waitForNotExist(await ResourcesPage.getListItemEl('SE4'));
        await ResourcesPage.clickHierarchyButton('SE4-F1');
        await NavbarPage.awaitAlert('Die Ressource kann nicht aufgerufen werden, da sie einer Ressource der nicht '
            + 'konfigurierten Kategorie "Grave" untergeordnet ist.', false);
    });


    test('delete operation category with existing resources & show warning for isRecordedIn resources', async () => {

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickSwitchHierarchyMode();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
        await ConfigurationPage.deleteCategory('Trench', 'Operation', true);
        await waitForNotExist(await CategoryPickerPage.getCategory('Trench', 'Operation'));
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await waitForExist(await ResourcesPage.getListItemEl('A1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('S1'));
        await ResourcesPage.clickHierarchyButton('SE0');
        await NavbarPage.awaitAlert('Die Ressource kann nicht aufgerufen werden, da sie einer Maßnahme der nicht '
            + 'konfigurierten Kategorie "Trench" angehört.', false);
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

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neue Kategorie');
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
        await ResourcesPage.typeInMoveModalSearchBarInput('Feature');
        const labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        expect(await getText(labels.nth(0))).toEqual('Feature1');

        await ResourcesPage.clickCancelInMoveModal();
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
        await EditConfigurationPage.typeInTranslation(0, 0, 'Editierte Kategorie');
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

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neues Feld');
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


    test('add custom group', async () => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickAddGroupButton();
        await AddGroupModalPage.typeInSearchFilterInput('newGroup');
        await AddGroupModalPage.clickCreateNewGroup();

        await EditConfigurationPage.typeInTranslation(0, 0, 'Neue Gruppe');
        await EditConfigurationPage.clickConfirm();
        await waitForExist(await ConfigurationPage.getGroup('test:newGroup'));
        
        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddGroupButton();
        await AddGroupModalPage.typeInSearchFilterInput('newGroup');
        await AddGroupModalPage.clickSelectGroup('test:newGroup');
        await AddGroupModalPage.clickConfirmSelection();
        await waitForExist(await ConfigurationPage.getGroup('test:newGroup'));

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
});
