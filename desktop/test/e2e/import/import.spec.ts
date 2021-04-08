import {browser, by, element, protractor} from 'protractor';
import {ImportPage} from './import.page';
import {ResourcesPage} from '../resources/resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';

const common = require('../common.js');
const delays = require('../delays');
const EC = protractor.ExpectedConditions;

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('import --', () => {

    beforeEach(() => {

        browser.sleep(1500);

        MenuPage.navigateToSettings();
        browser.sleep(1)
            .then(() => common.resetApp());
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');
        MenuPage.navigateToImport();
    });


    const importIt = (url: string, operationOption: number = 0) => {

        expect(ImportPage.getSourceOptionValue(1)).toEqual('http');
        ImportPage.clickSourceOption(1);
        common.typeIn(ImportPage.getImportURLInput(), url);
        ImportPage.clickOperationOption(operationOption);
        ImportPage.clickStartImportButton();
        browser.wait(EC.stalenessOf(ImportPage.getImportModal()), delays.ECWaitTime);
    };


    it('perform successful import', () => {

        importIt('./test-data/importer-test-ok.jsonl');
        browser.sleep(delays.shortRest * 4);

        NavbarPage.clickCloseNonResourcesTab();
        ResourcesPage.clickHierarchyButton('importedTrench');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob4')), delays.ECWaitTime);
    });


    it('err case', () => {

        importIt('./test-data/importer-test-constraint-violation.jsonl');

        NavbarPage.awaitAlert('existiert bereits', false);
        element(by.css('.alert button')).click();
        NavbarPage.clickCloseNonResourcesTab();
        ResourcesPage.clickHierarchyButton('S1');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
    });
});
