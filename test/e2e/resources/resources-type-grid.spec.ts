import {browser, protractor} from 'protractor';
import {MenuPage} from '../menu.page';
import {ResourcesPage} from './resources.page';
import {SettingsPage} from '../settings/settings.page';
import {ResourcesTypeGridPage} from './resources-type-grid.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Thomas Kleinke
 */
describe('resources/type-grid --', () => {

    let index = 0;


    beforeAll(function() {
        SettingsPage.get();
        browser.sleep(delays.shortRest);
        MenuPage.navigateToTypes();
        browser.sleep(delays.shortRest);
    });


    beforeEach(async done => {

        if (index > 0) {
            SettingsPage.get();
            browser.sleep(delays.shortRest);
            await common.resetApp();
            browser.sleep(delays.shortRest);
            MenuPage.navigateToTypes();
            browser.sleep(delays.shortRest);
        }

        index++;
        done();
    });


    it('Show linked find for type', () => {

        ResourcesPage.performCreateResource('tc1', 'TypeCatalog', undefined,
            undefined, true, true);
        ResourcesTypeGridPage.clickGridElement('tc1');
        ResourcesPage.performCreateResource('t1', 'Type', undefined,
            undefined, true, true);
        ResourcesTypeGridPage.clickGridElement('t1');

        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()));

        ResourcesTypeGridPage.clickEditButton();
        DoceditPage.clickGotoIdentificationTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('hat-instanz');
        DoceditRelationsTabPage.typeInRelationByIndices('hat-instanz', 0,
            'testf1');
        DoceditRelationsTabPage.clickChooseRelationSuggestion('hat-instanz', 0,
            0);
        DoceditPage.clickSaveDocument();

        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()));
    });
});