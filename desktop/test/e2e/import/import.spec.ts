import { start, stop, waitForExist, resetApp, navigateTo, waitForNotExist, typeIn, pause } from '../app';
import { ImportPage } from './import.page';
import { ResourcesPage } from '../resources/resources.page';
import { NavbarPage } from '../navbar.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
test.describe('import --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await navigateTo('import');
    });


    test.afterAll(async () => {

        await stop();
    });


    const performImport = async (url: string) => {

        expect(await ImportPage.getSourceOptionValue(1)).toEqual('http');
        await ImportPage.clickSourceOption('http');
        await typeIn(await ImportPage.getImportURLInput(), url);
        await ImportPage.clickStartImportButton();
        await pause(2000);
        await waitForNotExist(await ImportPage.getImportModal());
    };


    test('perform successful import', async () => {

        await performImport('./test-data/importer-test-ok.jsonl');

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('importedTrench');

        await waitForExist(await ResourcesPage.getListItemEl('obob1'));
        await waitForExist(await ResourcesPage.getListItemEl('obob2'));
        await waitForExist(await ResourcesPage.getListItemEl('obob3'));
        await waitForExist(await ResourcesPage.getListItemEl('obob4'));
    });


    test('warn in case of an already existing resource', async () => {

        await performImport('./test-data/importer-test-constraint-violation.jsonl');

        await NavbarPage.awaitAlert('wurde nicht importiert, weil bereits eine Ressource ' +
            'mit dem gleichen Bezeichner existiert', false);
        await NavbarPage.clickCloseAllMessages();
        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));
    });
});
