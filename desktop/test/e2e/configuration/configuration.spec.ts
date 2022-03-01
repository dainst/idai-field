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

        await ConfigurationPage.clickOpenContextMenuForCategory('Floor', 'Feature');
        await ConfigurationPage.clickContextMenuDeleteOption();
        await ConfigurationPage.clickConfirmDeletionButton();
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
        await ConfigurationPage.clickOpenContextMenuForCategory('Grave', 'Feature');
        await ConfigurationPage.clickContextMenuDeleteOption();
        await ConfigurationPage.typeInConfirmDeletionInput('Grave');
        await ConfigurationPage.clickConfirmDeletionButton();
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
});
