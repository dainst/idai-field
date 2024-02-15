import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist, pause } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesTypeGridPage } from './resources-type-grid.page';
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
    });


    test.afterAll(async () => {

        await stop();
    });


    async function createTypeCatalogAndType(typeCatalogIdentifier: string = 'TC1', typeIdentifier: string = 'T1') {

        await ResourcesPage.performCreateResource(typeCatalogIdentifier, 'TypeCatalog', undefined,
            undefined, true, true);
        await ResourcesTypeGridPage.clickGridElement(typeCatalogIdentifier);
        return ResourcesPage.performCreateResource(typeIdentifier, 'Type', undefined, undefined, true, true);
    }


    async function linkWithFind() {

        await ResourcesTypeGridPage.clickEditButton();
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('hasInstance');
        await DoceditRelationsPage.typeInRelation('hasInstance', 'testf1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        return DoceditPage.clickSaveDocument();
    }


    async function setCriterion(criterion: string) {

        await ResourcesTypeGridPage.clickEditButton();
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


    test('Show linked find for type', async () => {

        await createTypeCatalogAndType();

        await ResourcesTypeGridPage.clickGridElement('T1');
        await waitForNotExist(await ResourcesTypeGridPage.getLinkedDocumentsGrid());

        await linkWithFind();

        await ResourcesTypeGridPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        await ResourcesPage.clickNavigationButton('TC1');
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        const text = await ResourcesTypeGridPage.getTypeBadgeText('testf1');
        expect(text).toBe('T1');
    });


    test('Do not show linked finds in extended search mode', async () => {

        await createTypeCatalogAndType();
        await ResourcesTypeGridPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickSwitchHierarchyMode();
        await pause(2000);
        const elements = await ResourcesTypeGridPage.getGridElements();
        expect(await elements.count()).toBe(2);

        await waitForNotExist(await ResourcesTypeGridPage.getToggleLinkedDocumentsSectionButton());
        await waitForNotExist(await ResourcesTypeGridPage.getLinkedDocumentsGrid());
    });


    test('Move a type without subtypes to another catalog', async () => {

        await createTypeCatalogAndType();

        await ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        await ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined, undefined, true, true);

        await ResourcesTypeGridPage.clickGridElement('TC1');
        await ResourcesTypeGridPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        await ResourcesPage.clickResourceListItemInMoveModal('TC2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        await waitForExist(await ResourcesTypeGridPage.getGridElement('T1'));
        expect(await ResourcesTypeGridPage.getActiveNavigationButtonText()).toEqual('TC2');
    });


    test('Move a type with subtypes to another catalog', async () => {

        await createTypeCatalogAndType();

        await ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        await ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined, undefined, true, true);

        await ResourcesTypeGridPage.clickGridElement('TC1');
        await ResourcesTypeGridPage.clickGridElement('T1');
        await ResourcesPage.performCreateResource('T2', 'Type', undefined, undefined, true, true);
        await ResourcesPage.clickNavigationButton('TC1');

        await ResourcesTypeGridPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        await ResourcesPage.clickResourceListItemInMoveModal('TC2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        await waitForExist(await ResourcesTypeGridPage.getGridElement('T1'));
        expect(await ResourcesTypeGridPage.getActiveNavigationButtonText()).toEqual('TC2');
        
        await ResourcesTypeGridPage.clickGridElement('T1');
        await waitForExist(await ResourcesTypeGridPage.getGridElement('T2'));
    });


    test('Delete a type', async () => {

        await createTypeCatalogAndType();
        await ResourcesTypeGridPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickNavigationButton('TC1');

        await ResourcesTypeGridPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        await ResourcesTypeGridPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('T1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesTypeGridPage.getGridElement('T1'));
        await waitForNotExist(await ResourcesTypeGridPage.getGridElement('testf1'));
    });


    test('Link find with type via type relation picker', async () => {

        await createTypeCatalogAndType();

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
        await ResourcesTypeGridPage.clickToggleLinkedDocumentsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));
    });


    test('Filter types in type relation picker by criterion & catalog', async () => {

        await createTypeCatalogAndType();
        await setCriterion('Dekoration');

        await ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
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
