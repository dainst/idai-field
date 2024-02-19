import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist, pause } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesGridListPage } from './resources-grid-list.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { NavbarPage } from '../navbar.page';
import { DoceditTypeRelationsPage } from '../docedit/docedit-type-relations.page';
import { FieldsViewPage } from '../widgets/fields-view.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('resources/types --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('resources/types');
        await createTypeCatalogAndType();
    });


    test.afterAll(async () => {

        await stop();
    });


    async function createTypeCatalogAndType(typeCatalogIdentifier: string = 'TC1', typeIdentifier: string = 'T1') {

        await ResourcesPage.performCreateResource(typeCatalogIdentifier, undefined, undefined,
            undefined, true, true);
        await ResourcesGridListPage.clickGridElement(typeCatalogIdentifier);
        return ResourcesPage.performCreateResource(typeIdentifier, undefined, undefined, undefined, true, true);
    }


    async function linkWithFind() {

        await ResourcesGridListPage.clickEditButton();
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('hasInstance');
        await DoceditRelationsPage.typeInRelation('hasInstance', 'testf1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        return DoceditPage.clickSaveDocument();
    }


    async function setCriterion(criterion: string) {

        await ResourcesGridListPage.clickEditButton();
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditPage.clickSelectOption('criterion', criterion);
        return DoceditPage.clickSaveDocument();
    }


    async function checkCriterionOptions(expectedOptions: string[]) {

        const options = await DoceditTypeRelationsPage.getCriterionOptions();
        expect(await options.count()).toBe(expectedOptions.length);
        for (let i = 0; i < await options.count(); i++) {
            expect(await getText(options.nth(i))).toEqual(expectedOptions[i]);
        }
    }


    async function checkCatalogOptions(expectedOptions: string[]) {

        const options = await DoceditTypeRelationsPage.getCatalogOptions();
        expect(await options.count()).toBe(expectedOptions.length);
        for (let i = 0; i < await options.count(); i++) {
            expect(await getText(options.nth(i))).toEqual(expectedOptions[i]);
        }
    }


    test('show linked find for type', async () => {

        await ResourcesGridListPage.clickGridElement('T1');
        await waitForNotExist(await ResourcesGridListPage.getLinkedDocumentsGrid());

        await linkWithFind();

        await ResourcesGridListPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        await ResourcesPage.clickNavigationButton('TC1');
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        const text = await ResourcesGridListPage.getLinkedDocumentBadgeText('testf1');
        expect(text).toBe('T1');
    });


    test('do not show linked finds in extended search mode', async () => {

        await ResourcesGridListPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickSwitchHierarchyMode();
        await pause(2000);
        const elements = await ResourcesGridListPage.getGridElements();
        expect(await elements.count()).toBe(2);

        await waitForNotExist(await ResourcesGridListPage.getToggleLinkedDocumentsSectionButton());
        await waitForNotExist(await ResourcesGridListPage.getLinkedDocumentsGrid());
    });


    test('move a type without subtypes to another catalog', async () => {

        await ResourcesGridListPage.clickNavigationRootButton();
        await ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined, undefined, true, true);

        await ResourcesGridListPage.clickGridElement('TC1');
        await ResourcesGridListPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        await ResourcesPage.clickResourceListItemInMoveModal('TC2');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        await waitForExist(await ResourcesGridListPage.getGridElement('T1'));

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('Typenkataloge');
        expect(await getText(navigationButtons.nth(1))).toEqual('TC2');
        expect(await ResourcesPage.getActiveNavigationButtonText()).toEqual('TC2');
    });


    test('move a type with subtypes to another catalog', async () => {

        await ResourcesGridListPage.clickNavigationRootButton();
        await ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined, undefined, true, true);

        await ResourcesGridListPage.clickGridElement('TC1');
        await ResourcesGridListPage.clickGridElement('T1');
        await ResourcesPage.performCreateResource('T2', 'Type', undefined, undefined, true, true);
        await ResourcesPage.clickNavigationButton('TC1');

        await ResourcesGridListPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        await ResourcesPage.clickResourceListItemInMoveModal('TC2');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        await waitForExist(await ResourcesGridListPage.getGridElement('T1'));

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('Typenkataloge');
        expect(await getText(navigationButtons.nth(1))).toEqual('TC2');
        expect(await ResourcesPage.getActiveNavigationButtonText()).toEqual('TC2');
        
        await ResourcesGridListPage.clickGridElement('T1');
        await waitForExist(await ResourcesGridListPage.getGridElement('T2'));
    });


    test('delete a type', async () => {

        await ResourcesGridListPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickNavigationButton('TC1');

        await ResourcesGridListPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));

        await ResourcesGridListPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('T1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesGridListPage.getGridElement('T1'));
        await waitForNotExist(await ResourcesGridListPage.getGridElement('testf1'));
    });


    test('link find with type via type relation picker', async () => {

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();

        await ResourcesPage.openEditByDoubleClickResource('testf1');
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditTypeRelationsPage.clickAddTypeRelationButton('isInstanceOf');
        await DoceditTypeRelationsPage.clickType('T1');
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('testf1', 'info');
        await FieldsViewPage.clickAccordionTab(1);
        expect(await FieldsViewPage.getRelationValue(1, 0)).toEqual('T1');

        await navigateTo('resources/types');
        await ResourcesGridListPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesGridListPage.getGridElement('testf1'));
    });


    test('filter types in type relation picker by criterion & catalog', async () => {

        await setCriterion('Dekoration');

        await ResourcesGridListPage.clickNavigationRootButton();
        await createTypeCatalogAndType('TC2', 'T2');
        await setCriterion('Form');

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();

        await ResourcesPage.openEditByDoubleClickResource('testf1');
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditTypeRelationsPage.clickAddTypeRelationButton('isInstanceOf');

        await checkCriterionOptions(['Kein Kriterium', 'Dekoration', 'Form']);
        await checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        await waitForExist(await DoceditTypeRelationsPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsPage.getTypeRow('T2'));

        await DoceditTypeRelationsPage.clickCriterionOption('Dekoration');
        await checkCatalogOptions(['Alle Kataloge', 'TC1']);
        await waitForNotExist(await DoceditTypeRelationsPage.getTypeRow('T2'));

        await DoceditTypeRelationsPage.clickCriterionOption('Form');
        await checkCatalogOptions(['Alle Kataloge', 'TC2']);
        await waitForNotExist(await DoceditTypeRelationsPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsPage.getTypeRow('T2'));

        await DoceditTypeRelationsPage.clickCriterionOption('no-criterion');
        await checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        await waitForExist(await DoceditTypeRelationsPage.getTypeRow('T1'));

        await DoceditTypeRelationsPage.clickCatalogOption('TC1');
        await waitForNotExist(await DoceditTypeRelationsPage.getTypeRow('T2'));

        await DoceditTypeRelationsPage.clickCatalogOption('TC2');
        await waitForNotExist(await DoceditTypeRelationsPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsPage.getTypeRow('T2'));

        await DoceditTypeRelationsPage.clickType('T2');
        await DoceditPage.clickCloseEdit('discard');
    });
});
