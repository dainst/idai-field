import {browser, protractor} from 'protractor';
import {MenuPage} from '../menu.page';
import {ResourcesPage} from './resources.page';
import {ResourcesTypeGridPage} from './resources-type-grid.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';
import {DoceditTypeRelationsTabPage} from '../docedit/docedit-type-relations-tab.page';
import {FieldsViewPage} from '../widgets/fields-view.page';

const EC = protractor.ExpectedConditions;
const delays = require('../delays');
const common = require('../common');


/**
 * @author Thomas Kleinke
 */
describe('resources/types --', () => {

    beforeEach( () => {

        browser.sleep(1500);

        MenuPage.navigateToSettings();
        browser.sleep(1)
            .then(() => common.resetApp());
        MenuPage.navigateToTypes();
    });


    function createTypeCatalogAndType(typeCatalogIdentifier: string = 'TC1', typeIdentifier: string = 'T1') {

        ResourcesPage.performCreateResource(typeCatalogIdentifier, 'TypeCatalog',
            undefined, undefined, true, true);
        ResourcesTypeGridPage.clickGridElement(typeCatalogIdentifier);
        ResourcesPage.performCreateResource(typeIdentifier, 'Type', undefined,
            undefined, true, true);
    }


    function linkWithFind() {

        ResourcesTypeGridPage.clickEditButton();
        DoceditPage.clickGotoIdentificationTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('zugeordnete-funde');
        DoceditRelationsTabPage.typeInRelation('zugeordnete-funde', 'testf1');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(0);
        DoceditPage.clickSaveDocument();
    }


    function setCriterion(criterionIndex: number) {

        ResourcesTypeGridPage.clickEditButton();
        DoceditPage.clickGotoIdentificationTab();
        DoceditPage.clickSelectOption('criterion', criterionIndex);
        DoceditPage.clickSaveDocument();
    }


    function checkCriterionOptions(expectedOptions: string[]) {

        DoceditTypeRelationsTabPage.getCriterionOptions().then(options => {
            expect(options.length).toBe(expectedOptions.length);
            for (let i = 0; i < options.length; i++) {
                expect(options[i].getText()).toEqual(expectedOptions[i]);
            }
        });
    }


    function checkCatalogOptions(expectedOptions: string[]) {

        DoceditTypeRelationsTabPage.getCatalogOptions().then(options => {
            expect(options.length).toBe(expectedOptions.length);
            for (let i = 0; i < options.length; i++) {
                expect(options[i].getText()).toEqual(expectedOptions[i]);
            }
        });
    }


    it('Show linked find for type', () => {

        createTypeCatalogAndType();

        ResourcesTypeGridPage.clickGridElement('T1');
        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()), delays.ECWaitTime);

        linkWithFind();

        ResourcesTypeGridPage.clickToggleFindsSectionButton();
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getGridElement('testf1')),
            delays.ECWaitTime);

        ResourcesPage.clickNavigationButton('TC1');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getGridElement('testf1')),
            delays.ECWaitTime);

        ResourcesTypeGridPage.getTypeBadgeText('testf1').then(text => {
            expect(text).toBe('T1');
        });
    });


    it('Do not show linked finds in extended search mode', () => {

        createTypeCatalogAndType();
        ResourcesTypeGridPage.clickGridElement('T1');
        linkWithFind();

        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesTypeGridPage.getGridElements().then(elements => {
            expect(elements.length).toBe(2);
        });

        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getToggleFindsSectionButton()));
        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getLinkedDocumentsGrid()));
    });


    it('Move a type to another catalog', () => {

        createTypeCatalogAndType();

        ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined,
            undefined, true, true);

        ResourcesTypeGridPage.clickGridElement('TC1');
        ResourcesTypeGridPage.clickOpenContextMenu('T1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        ResourcesPage.clickResourceListItemInMoveModal('TC2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getGridElement('T1')),
            delays.ECWaitTime);

        ResourcesTypeGridPage.getActiveNavigationButtonText().then(text => {
            expect(text).toEqual('TC2');
        });
    });


    it('Delete a type', () => {

        createTypeCatalogAndType();
        ResourcesTypeGridPage.clickGridElement('T1');
        linkWithFind();

        ResourcesPage.clickNavigationButton('TC1');

        ResourcesTypeGridPage.clickToggleFindsSectionButton();
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getGridElement('testf1')),
            delays.ECWaitTime);

        ResourcesTypeGridPage.clickOpenContextMenu('T1');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('T1');
        ResourcesPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getGridElement('T1')),
            delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesTypeGridPage.getGridElement('testf1')),
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
        DoceditTypeRelationsTabPage.clickType('T1');
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickSelectResource('testf1', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.getRelationValue(1, 0).then(relationValue => {
            expect(relationValue).toEqual('T1');
        });

        MenuPage.navigateToTypes();
        ResourcesTypeGridPage.clickToggleFindsSectionButton();
        browser.wait(EC.presenceOf(ResourcesTypeGridPage.getGridElement('testf1')),
            delays.ECWaitTime);
    });


    it('Filter types in type relation picker by criterion & catalog', () => {

        createTypeCatalogAndType();
        setCriterion(1);

        ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        createTypeCatalogAndType('TC2', 'T2');
        setCriterion(2);

        NavbarPage.clickCloseNonResourcesTab();
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenChildCollectionButton();

        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickGotoIdentificationTab();
        DoceditTypeRelationsTabPage.clickAddTypeRelationButton('instanceOf');

        checkCriterionOptions(['Kein Kriterium', 'Dekoration', 'Form']);
        checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        browser.wait(EC.presenceOf(DoceditTypeRelationsTabPage.getTypeRow('T1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(DoceditTypeRelationsTabPage.getTypeRow('T2')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickCriterionOption(1);
        checkCatalogOptions(['Alle Kataloge', 'TC1']);
        browser.wait(EC.stalenessOf(DoceditTypeRelationsTabPage.getTypeRow('T2')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickCriterionOption(2);
        checkCatalogOptions(['Alle Kataloge', 'TC2']);
        browser.wait(EC.stalenessOf(DoceditTypeRelationsTabPage.getTypeRow('T1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(DoceditTypeRelationsTabPage.getTypeRow('T2')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickCriterionOption(0);
        checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        browser.wait(EC.presenceOf(DoceditTypeRelationsTabPage.getTypeRow('T1')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickCatalogOption(1);
        browser.wait(EC.stalenessOf(DoceditTypeRelationsTabPage.getTypeRow('T2')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickCatalogOption(2);
        browser.wait(EC.stalenessOf(DoceditTypeRelationsTabPage.getTypeRow('T1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(DoceditTypeRelationsTabPage.getTypeRow('T2')), delays.ECWaitTime);

        DoceditTypeRelationsTabPage.clickType('T2');
        DoceditPage.clickCloseEdit('discard');
    });
});
