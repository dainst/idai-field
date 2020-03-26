import {browser, protractor} from 'protractor';
import {MenuPage} from '../menu.page';
import {ResourcesPage} from './resources.page';
import {SettingsPage} from '../settings/settings.page';
import {ResourcesTypeGridPage} from './resources-type-grid.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';
import {DoceditTypeRelationsTabPage} from '../docedit/docedit-type-relations-tab.page';
import {FieldsViewPage} from '../widgets/fields-view.page';

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


    it('Move a type to another catalog', () => {

        createTypeCatalogAndType();

        ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        ResourcesPage.performCreateResource('tc2', 'TypeCatalog', undefined,
            undefined, true, true);

        ResourcesTypeGridPage.clickGridElement('tc1');
        ResourcesTypeGridPage.clickOpenContextMenu('t1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('tc2');
        ResourcesPage.clickResourceListItemInMoveModal('tc2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getTypeGridElement('t1')),
            delays.ECWaitTime);

        ResourcesTypeGridPage.getActiveNavigationButtonText().then(text => {
            expect(text).toEqual('tc2');
        });
    });


    it('Delete a type', () => {

        createTypeCatalogAndType();
        ResourcesTypeGridPage.clickGridElement('t1');
        linkWithFind();

        ResourcesPage.clickNavigationButton('tc1');

        ResourcesTypeGridPage.clickOpenContextMenu('t1');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('t1');
        ResourcesPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getTypeGridElement('t1')),
            delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentGridElement('testf1')),
            delays.ECWaitTime);
    });


    it('Link find with type via type relation picker', () => {

        createTypeCatalogAndType();

        NavbarPage.clickCloseNonResourcesTab();
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenChildCollectionButton();

        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickGotoIdentificationTab();
        DoceditTypeRelationsTabPage.clickAddTypeRelationButton('instanceOf');
        DoceditTypeRelationsTabPage.clickType('t1');
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickSelectResource('testf1', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.getRelationValue(1, 0).then(relationValue => {
            expect(relationValue).toEqual('t1');
        });

        MenuPage.navigateToTypes();
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getLinkedDocumentGridElement('testf1')),
            delays.ECWaitTime);
    });
});