import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from './configuration.page';
import { AddCategoryFormModalPage } from './add-category-form-modal.page';
import { EditConfigurationPage } from './edit-configuration.page';


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
        expect((await ConfigurationPage.getCategories()).length).toBe(6);
        await waitForExist(await ConfigurationPage.getCategory('Project'));
        await waitForExist(await ConfigurationPage.getCategory('Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Trench', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Building', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Survey', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Place'));

        await ConfigurationPage.clickSelectCategoriesFilter('trench');
        await waitForNotExist(await ConfigurationPage.getCategory('Project'));
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Find'));

        await ConfigurationPage.clickSelectCategoriesFilter('images');
        await waitForNotExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Image'));

        await ConfigurationPage.clickSelectCategoriesFilter('types');
        await waitForNotExist(await ConfigurationPage.getCategory('Image'));
        await waitForExist(await ConfigurationPage.getCategory('TypeCatalog'));
        await waitForExist(await ConfigurationPage.getCategory('Type'));

        done();
    });


    it('delete category', async done => {

        await ConfigurationPage.deleteCategory('Floor', 'Feature');
        await waitForNotExist(await ConfigurationPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();
        
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForNotExist(await ConfigurationPage.getCategory('Floor', 'Feature'));

        done();
    });


    it('delete category with existing resources & show warning for liesWithin resources', async done => {

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickSwitchHierarchyMode();
        await waitForExist(await ResourcesPage.getListItemEl('SE4'));
        
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('all');
        await ConfigurationPage.deleteCategory('Grave', 'Feature', true);
        await waitForNotExist(await ConfigurationPage.getCategory('Grave', 'Feature'));
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
        await waitForNotExist(await ConfigurationPage.getCategory('Trench', 'Operation'));
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
        await waitForNotExist(await ConfigurationPage.getCategory('Floor', 'Feature'));
        
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
        await AddCategoryFormModalPage.clickAddCategory();
        await waitForExist(await ConfigurationPage.getCategory('Floor', 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Floor', 'Feature'));

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

        await waitForExist(await ConfigurationPage.getCategory('Test:NewCategory', 'Feature'));
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickCreateResource();
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Test:NewCategory', 'Feature'));
        expect((await ConfigurationPage.getCategoryLabel('Test:NewCategory', 'Feature'))).toEqual('Neue Kategorie');

        done();
    });
});
