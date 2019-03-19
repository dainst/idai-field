import {browser, by, element, protractor} from 'protractor';
import {ImportPage} from './import.page';
import {ResourcesPage} from '../resources/resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';

const common = require('../common.js');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
describe('import --', function() {

    let index = 0;


    beforeAll(function() {

        ImportPage.get();
    });


    beforeEach(async done => {

        if (index > 0) {
            MenuPage.navigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickReturnToResourcesTabs();
            NavbarPage.clickTab('project');
            browser.sleep(delays.shortRest * 4);
            MenuPage.navigateToImport();
        }

        index++;
        done();
    });


    let importIt = function(url, mainTypeDocumentOption = 0) {

        expect(ImportPage.getSourceOptionValue(1)).toEqual('http');
        ImportPage.clickSourceOption(1);
        expect(ImportPage.getFormatOptionValue(0)).toEqual('native');
        ImportPage.clickFormatOption(0);
        ImportPage.clickOperationOption(mainTypeDocumentOption);
        common.typeIn(ImportPage.getImportURLInput(), url);
        ImportPage.clickStartImportButton();
        browser.wait(EC.stalenessOf(ImportPage.getImportModal()), delays.ECWaitTime);
    };


    it('perform successful import', () => {

        importIt('./test/test-data/importer-test-ok.jsonl');
        browser.sleep(delays.shortRest * 4);

        NavbarPage.clickCloseNonResourcesTab();
        ResourcesPage.performJumpToTrenchView('importedTrench');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob4')), delays.ECWaitTime);
    });


    xit('err case', () => {

        importIt('./test/test-data/importer-test-constraint-violation.jsonl');

        NavbarPage.awaitAlert('existiert bereits', false);
        element(by.css('.alert button')).click();
        NavbarPage.clickTab('project');
        ResourcesPage.performJumpToTrenchView('S1');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
    });
});
