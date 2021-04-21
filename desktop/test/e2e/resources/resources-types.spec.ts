import { getText, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ResourcesPage } from './resources.page';
import { ResourcesTypeGridPage } from './resources-type-grid.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsTabPage } from '../docedit/docedit-relations-tab.page';
import { NavbarPage } from '../navbar.page';
import { DoceditTypeRelationsTabPage } from '../docedit/docedit-type-relations-tab.page';
import { FieldsViewPage } from '../widgets/fields-view.page';


/**
 * @author Thomas Kleinke
 */
describe('resources/types --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('resources/types');
        done();
    });


    afterAll(async done => {

        await stop();
        done();
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
        await DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('zugeordnete-funde');
        await DoceditRelationsTabPage.typeInRelation('zugeordnete-funde', 'testf1');
        await DoceditRelationsTabPage.clickChooseRelationSuggestion(0);
        return DoceditPage.clickSaveDocument();
    }


    async function setCriterion(criterion: string) {

        await ResourcesTypeGridPage.clickEditButton();
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditPage.clickSelectOption('criterion', criterion);
        return DoceditPage.clickSaveDocument();
    }


    async function checkCriterionOptions(expectedOptions: string[]) {

        const options = await DoceditTypeRelationsTabPage.getCriterionOptions();
        expect(options.length).toBe(expectedOptions.length);
        for (let i = 0; i < options.length; i++) {
            expect(await getText(options[i])).toEqual(expectedOptions[i]);
        }
    }


    async function checkCatalogOptions(expectedOptions: string[]) {

        const options = await DoceditTypeRelationsTabPage.getCatalogOptions();
        expect(options.length).toBe(expectedOptions.length);
        for (let i = 0; i < options.length; i++) {
            expect(await getText(options[i])).toEqual(expectedOptions[i]);
        }
    }


    it('Show linked find for type', async done => {

        await createTypeCatalogAndType();

        await ResourcesTypeGridPage.clickGridElement('T1');
        await waitForNotExist(await ResourcesTypeGridPage.getLinkedDocumentsGrid());

        await linkWithFind();

        await ResourcesTypeGridPage.clickToggleFindsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        await ResourcesPage.clickNavigationButton('TC1');
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        const text = await ResourcesTypeGridPage.getTypeBadgeText('testf1');
        expect(text).toBe('T1');

        done();
    });


    it('Do not show linked finds in extended search mode', async done => {

        await createTypeCatalogAndType();
        await ResourcesTypeGridPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickSwitchHierarchyMode();
        const elements = await ResourcesTypeGridPage.getGridElements();
        expect(elements.length).toBe(2);

        await waitForNotExist(await ResourcesTypeGridPage.getToggleFindsSectionButton());
        await waitForNotExist(await ResourcesTypeGridPage.getLinkedDocumentsGrid());

        done();
    });


    it('Move a type to another catalog', async done => {

        await createTypeCatalogAndType();

        await ResourcesTypeGridPage.clickTypeCatalogsNavigationButton();
        await ResourcesPage.performCreateResource('TC2', 'TypeCatalog', undefined,
            undefined, true, true);

        await ResourcesTypeGridPage.clickGridElement('TC1');
        await ResourcesTypeGridPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('TC2');
        await ResourcesPage.clickResourceListItemInMoveModal('TC2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        await waitForExist(await ResourcesTypeGridPage.getGridElement('T1'));

        const text = await ResourcesTypeGridPage.getActiveNavigationButtonText();
        expect(text).toEqual('TC2');

        done();
    });


    it('Delete a type', async done => {

        await createTypeCatalogAndType();
        await ResourcesTypeGridPage.clickGridElement('T1');
        await linkWithFind();

        await ResourcesPage.clickNavigationButton('TC1');

        await ResourcesTypeGridPage.clickToggleFindsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        await ResourcesTypeGridPage.clickOpenContextMenu('T1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('T1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesTypeGridPage.getGridElement('T1'));
        await waitForNotExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        done();
    });


    it('Link find with type via type relation picker', async done => {

        await createTypeCatalogAndType();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();

        await ResourcesPage.openEditByDoubleClickResource('testf1');
        await DoceditPage.clickGotoIdentificationTab();
        await DoceditTypeRelationsTabPage.clickAddTypeRelationButton('instanceOf');
        await DoceditTypeRelationsTabPage.clickType('T1');
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('testf1', 'info');
        await FieldsViewPage.clickAccordionTab(1);
        const relationValue = await FieldsViewPage.getRelationValue(1, 0);
        expect(relationValue).toEqual('T1');

        navigateTo('resources/types');
        await ResourcesTypeGridPage.clickToggleFindsSectionButton();
        await waitForExist(await ResourcesTypeGridPage.getGridElement('testf1'));

        done();
    });


    it('Filter types in type relation picker by criterion & catalog', async done => {

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
        await DoceditTypeRelationsTabPage.clickAddTypeRelationButton('instanceOf');

        await checkCriterionOptions(['Kein Kriterium', 'Dekoration', 'Form']);
        await checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        await waitForExist(await DoceditTypeRelationsTabPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsTabPage.getTypeRow('T2'));

        await DoceditTypeRelationsTabPage.clickCriterionOption('Dekoration');
        await checkCatalogOptions(['Alle Kataloge', 'TC1']);
        await waitForNotExist(await DoceditTypeRelationsTabPage.getTypeRow('T2'));

        await DoceditTypeRelationsTabPage.clickCriterionOption('Form');
        await checkCatalogOptions(['Alle Kataloge', 'TC2']);
        await waitForNotExist(await DoceditTypeRelationsTabPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsTabPage.getTypeRow('T2'));

        await DoceditTypeRelationsTabPage.clickCriterionOption('no-criterion');
        await checkCatalogOptions(['Alle Kataloge', 'TC1', 'TC2']);
        await waitForExist(await DoceditTypeRelationsTabPage.getTypeRow('T1'));

        await DoceditTypeRelationsTabPage.clickCatalogOption('TC1');
        await waitForNotExist(await DoceditTypeRelationsTabPage.getTypeRow('T2'));

        await DoceditTypeRelationsTabPage.clickCatalogOption('TC2');
        await waitForNotExist(await DoceditTypeRelationsTabPage.getTypeRow('T1'));
        await waitForExist(await DoceditTypeRelationsTabPage.getTypeRow('T2'));

        await DoceditTypeRelationsTabPage.clickType('T2');
        await DoceditPage.clickCloseEdit('discard');

        done();
    });
});
