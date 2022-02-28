import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from './configuration.page';


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
        await ConfigurationPage.selectCategoriesFilter('all');
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });
    

    it('apply categories filter', async done => {

        await ConfigurationPage.selectCategoriesFilter('project');
        expect((await ConfigurationPage.getCategories()).length).toBe(6);
        await waitForExist(await ConfigurationPage.getCategory('Project'));
        await waitForExist(await ConfigurationPage.getCategory('Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Trench', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Building', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Survey', 'Operation'));
        await waitForExist(await ConfigurationPage.getCategory('Place'));

        await ConfigurationPage.selectCategoriesFilter('trench');
        await waitForNotExist(await ConfigurationPage.getCategory('Project'));
        await waitForExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Find'));

        await ConfigurationPage.selectCategoriesFilter('images');
        await waitForNotExist(await ConfigurationPage.getCategory('Feature'));
        await waitForExist(await ConfigurationPage.getCategory('Image'));

        await ConfigurationPage.selectCategoriesFilter('types');
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
});
