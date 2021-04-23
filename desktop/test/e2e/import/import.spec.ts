import { start, stop, waitForExist, resetApp, navigateTo, waitForNotExist, typeIn } from '../app';
import { ImportPage } from './import.page';
import { ResourcesPage } from '../resources/resources.page';
import { NavbarPage } from '../navbar.page';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('import --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await navigateTo('import');
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    const performImport = async (url: string) => {

        expect(await ImportPage.getSourceOptionValue(1)).toEqual('http');
        await ImportPage.clickSourceOption('http');
        await typeIn(await ImportPage.getImportURLInput(), url);
        await ImportPage.clickStartImportButton();
        await waitForNotExist(await ImportPage.getImportModal());
    };


    it('perform successful import', async done => {

        await performImport('./test-data/importer-test-ok.jsonl');

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('importedTrench');

        await waitForExist(await ResourcesPage.getListItemEl('obob1'));
        await waitForExist(await ResourcesPage.getListItemEl('obob2'));
        await waitForExist(await ResourcesPage.getListItemEl('obob3'));
        await waitForExist(await ResourcesPage.getListItemEl('obob4'));

        done();
    });


    it('warn in case of an already existing resource', async done => {

        await performImport('./test-data/importer-test-constraint-violation.jsonl');

        await NavbarPage.awaitAlert('wurde nicht importiert, weil bereits eine Ressource ' +
            'mit dem gleichen Bezeichner existiert', false);
        await NavbarPage.clickCloseAllMessages();
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));

        done();
    });
});
