import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view-page';
import {RelationsViewPage} from '../widgets/relations-view.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 3);
    });


    beforeEach(async () => {
        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
        }
        i++;
    });


    it('should delete a main type resource', () => {

        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        NavbarPage.clickNavigateToProject();
        ResourcesPage.openEditByDoubleClickResource('newTrench');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('newTrench');
        DoceditPage.clickConfirmDeleteInModal();

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.openEditByDoubleClickResource('trench1');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('trench1');
        DoceditPage.clickConfirmDeleteInModal();

        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(element(by.css('.no-main-type-resource-alert'))), delays.ECWaitTime);

        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('find it by its identifier', () => {

        ResourcesPage.performCreateResource('1');
        SearchBarPage.typeInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')),delays.ECWaitTime);
    });


    it('should delete a resource', () => {

        ResourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('not reflect changes in overview in realtime', () => {

        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1a')});
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('should save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('2')});
    });


    it('should discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1')});
    });


    it('should cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('should create a new main type resource', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('newTrench'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('should refresh the resources list when switching main type documents', () => {

        ResourcesPage.performCreateMainTypeResource('newTrench');
        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.performSelectOperation(1);
        // ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        // ResourcesPage.performSelectOperation(0);
        // ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('should edit a main type resource', () => { // TODO is this test still necessary?

        NavbarPage.clickNavigateToProject();
        ResourcesPage.openEditByDoubleClickResource('trench1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('newIdentifier'));
    });


    it('should change the type of a resource to a child type', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Architektur'));
    });


    it('should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();

        DoceditPage.clickSelectOption('hasWallType', 1);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        FieldsViewPage.getFieldValue(0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseMessage();
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Stratigrafische Einheit'));
        browser.wait(EC.stalenessOf(FieldsViewPage.getFieldElement(0)));
    });


    it('should delete invalid relations when changing the type of a resource to a sibling type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'wall_surface');
        ResourcesPage.performCreateRelation('1', '2', 9);
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        RelationsViewPage.getRelationValue(0).then(relationValue => expect(relationValue).toEqual('1'));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        RelationsViewPage.getRelationValue(0).then(relationValue => expect(relationValue).toEqual('2'));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-layer');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern '
            + 'verloren gehen: Trägt');
        NavbarPage.clickCloseMessage();
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Erdbefund'));
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    it('hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });
});
