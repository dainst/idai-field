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
            MenuPage.navigateToSettings();
            browser.sleep(delays.shortRest);
            await common.resetApp();
            browser.sleep(delays.shortRest);
            MenuPage.navigateToTypes();
            browser.sleep(delays.shortRest);
        }

        index++;
        done();
    });


    function createTypeCatalogAndType() {

        ResourcesPage.performCreateResource('tc1', 'TypeCatalog', undefined,
            undefined, true, true);
        ResourcesTypeGridPage.clickGridElement('tc1');
        ResourcesPage.performCreateResource('t1', 'Type', undefined,
            undefined, true, true);
    }


    function linkWithFind() {

        ResourcesTypeGridPage.clickEditButton();
        DoceditPage.clickGotoIdentificationTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('hat-instanz');
        DoceditRelationsTabPage.typeInRelationByIndices('hat-instanz', 0,
            'testf1');
        DoceditRelationsTabPage.clickChooseRelationSuggestion('hat-instanz', 0,
            0);
        DoceditPage.clickSaveDocument();
    }


    it('Show linked find for type', () => {

        createTypeCatalogAndType();

        ResourcesTypeGridPage.clickGridElement('t1');
        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()));

        linkWithFind();
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getLinkedDocumentGridElement('testf1')));

        ResourcesPage.clickNavigationButton('tc1');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getLinkedDocumentGridElement('testf1')));

        ResourcesTypeGridPage.getTypeBadgeText('testf1').then(text => {
            expect(text).toBe('t1');
        });
    });


    it('Do not show linked finds in extended search mode', () => {

        createTypeCatalogAndType();
        ResourcesTypeGridPage.clickGridElement('t1');
        linkWithFind();

        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesTypeGridPage.getTypeGridElements().then(elements => {
            expect(elements.length).toBe(2);
        });

        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()));
    });
});