import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from './configuration.page';
import { AddCategoryFormModalPage } from './add-category-form-modal.page';
import { EditConfigurationPage } from './edit-configuration.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { DoceditPage } from '../docedit/docedit.page';
import { AddFieldModalPage } from './add-field-modal.page';
import { AddGroupModalPage } from './add-group-modal.page';
import { ManageValuelistsModalPage } from './manage-valuelists-modal.page';


/**
 * @author Thomas Kleinke
 */
describe('configuration --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });
    

    it('apply categories filter', async done => {

        await ConfigurationPage.clickSelectCategoriesFilter('project');
        expect((await CategoryPickerPage.getCategories()).length).toBe(6);
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

        done();
    });


    it('delete category', async done => {

        await ConfigurationPage.deleteCategory('Floor', 'Feature');
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await CategoryPickerPage.getCategory('Feature'));
        await waitForNotExist(await CategoryPickerPage.getCategory('Floor', 'Feature'));

        done();
    });


    it('delete category with existing resources & show warning for liesWithin resources', async done => {

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

        done();
    });


    it('delete operation category with existing resources & show warning for isRecordedIn resources', async done => {

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

        done();
    });


    it('add category from library', async done => {

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

        done();
    });


    it('add custom category', async done => {

        await ConfigurationPage.clickCreateSubcategory('Feature');
        await AddCategoryFormModalPage.typeInSearchFilterInput('NewCategory');
        await AddCategoryFormModalPage.clickCreateNewCategory();

        await EditConfigurationPage.clickSelectLanguage(0, 'de');
        await EditConfigurationPage.clickAddLanguage(0);
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

        done();
    });


    it('swap category form', async done => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickSelectGroup('parent');
        await waitForExist(await ConfigurationPage.getField('gazId'));
        await waitForExist(await ConfigurationPage.getField('description'));
        expect((await ConfigurationPage.getFields()).length).toBeGreaterThan(1);

        await CategoryPickerPage.clickOpenContextMenu('Place');
        await ConfigurationPage.clickContextMenuSwapOption();
        await waitForExist(await AddCategoryFormModalPage.getCategoryHeader('Place'));
        await waitForExist(await AddCategoryFormModalPage.getSelectFormButton('Place'));
        await waitForNotExist(await AddCategoryFormModalPage.getSelectFormButton('Place:default'));
        await AddCategoryFormModalPage.clickSelectForm('Place');
        await AddCategoryFormModalPage.clickConfirmSelection();
        await ConfigurationPage.clickSelectGroup('parent');
        await waitForExist(await ConfigurationPage.getField('gazId'));
        await waitForNotExist(await ConfigurationPage.getField('description'));
        expect((await ConfigurationPage.getFields()).length).toBe(1);
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await CategoryPickerPage.clickSelectCategory('Place');
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.clickGotoParentTab();
        await waitForExist(await DoceditPage.getField('gazId'));
        await waitForNotExist(await DoceditPage.getField('description'));
        await DoceditPage.clickCloseEdit();

        done();
    });


    it('add library field as custom field', async done => {

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

        done();
    });


    it('add newly created field as custom field', async done => {

        await CategoryPickerPage.clickSelectCategory('Place');
        await ConfigurationPage.clickAddFieldButton();
        await AddFieldModalPage.typeInSearchFilterInput('newField');
        await AddFieldModalPage.clickCreateNewField();

        await EditConfigurationPage.clickSelectLanguage(0, 'de');
        await EditConfigurationPage.clickAddLanguage(0);
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

        done();
    });


    it('inherit custom field from parent form', async done => {

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

        done();
    });


    it('reset custom changes when swapping category form', async done => {

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

        done();
    });


    it('add custom group', async done => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickAddGroupButton();
        await AddGroupModalPage.typeInSearchFilterInput('newGroup');
        await AddGroupModalPage.clickCreateNewGroup();

        await EditConfigurationPage.clickSelectLanguage(0, 'de');
        await EditConfigurationPage.clickAddLanguage(0);
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

        done();
    });


    it('swap valuelist via field editor', async done => {

        await CategoryPickerPage.clickSelectCategory('Feature');
        await ConfigurationPage.clickSelectGroup('time');
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('Archaisch');

        await ConfigurationPage.clickOpenContextMenuForField('period');
        await ConfigurationPage.clickContextMenuEditOption();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('periods-default-1');
        expect(await EditConfigurationPage.getValue(0)).toEqual('Archaisch');
        await EditConfigurationPage.clickSwapValuelist();
        await ManageValuelistsModalPage.clickSelectValuelist('colors-default-1');
        await ManageValuelistsModalPage.clickConfirmSelection();

        expect(await EditConfigurationPage.getSelectedValuelist()).toEqual('colors-default-1');
        expect(await EditConfigurationPage.getValue(0)).toEqual('beige');
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.clickSelectField('period');
        expect(await ConfigurationPage.getValue(0)).toEqual('beige');
        await ConfigurationPage.save();

        done();
    });
});
