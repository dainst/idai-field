import {browser, by, element, protractor} from 'protractor';
import {ImportPage} from './import.page';
import {ResourcesPage} from '../resources/resources.page';
import {NavbarPage} from '../navbar.page';
import {OperationBarPage} from '../operation-bar.page';

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
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.performNavigateToImport();
        }

        index++;
        done();
    });


    let importIt = function(url, mainTypeDocumentOption = 0) {

        expect(ImportPage.getSourceOptionValue(1)).toEqual('http');
        ImportPage.clickSourceOption(1);
        expect(ImportPage.getFormatOptionValue(0)).toEqual('native');
        ImportPage.clickFormatOption(0);
        ImportPage.clickMainTypeDocumentOption(mainTypeDocumentOption);
        common.typeIn(ImportPage.getImportURLInput(), url);
        ImportPage.clickStartImportButton();
        browser.wait(EC.stalenessOf(ImportPage.getImportModal()), delays.ECWaitTime);
    };


    it('perform successful import', () => {

        importIt('./test/test-data/importer-test-ok.jsonl');
        browser.sleep(delays.shortRest * 4);
        NavbarPage.clickNavigateToExcavation();
        OperationBarPage.performSelectOperation(0);

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('obob4')), delays.ECWaitTime);
    });


    it('perform unsuccessful import with rollback', () => {

        importIt('./test/test-data/importer-test-constraint-violation.jsonl');

        NavbarPage.awaitAlert('existiert bereits', false);
        element(by.css('.alert button')).click();
        NavbarPage.clickNavigateToExcavation();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).not.toEqual('obob1'));
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).not.toEqual('obob2'));
    });
});
