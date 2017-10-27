import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    beforeEach(() => {

        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('create-main-type-document-button'))), delays.ECWaitTime);
    });

    it('should delete a main type resource', () => {

        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.clickEditMainTypeResource();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('newTrench');
        DoceditPage.clickConfirmDeleteInModal();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.clickEditMainTypeResource();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('trench1');
        DoceditPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(element(by.css('#mainTypeSelectBox'))), delays.ECWaitTime);
        browser.wait(EC.presenceOf(element(by.css('#mainTypeSelectBoxSubstitute'))), delays.ECWaitTime);

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
        DocumentViewPage.performEditDocument();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });

    it('not reflect changes in overview in realtime', () => {

        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DocumentViewPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1a')});
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of 'Neues Objekt' for every time the button was pressed.
     */
    xit('remove a new object from the list if it has not been saved', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemMarkedNewEl()), delays.ECWaitTime);
        ResourcesPage.scrollUp();
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        ResourcesPage.clickSelectResource('1');
        browser.wait(EC.presenceOf(element(by.id('document-view'))), delays.ECWaitTime);
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(0));
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.clickCloseEdit();
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(0));
    });

    it('should save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();
        browser.sleep(1000);
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('2')});
    });

    it('should discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1')});
    });

    it('should cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
    });

    it('should create a new main type resource', () => {

        browser.sleep(delays.shortRest * 50);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('newTrench'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });

    it('should refresh the resources list when switching main type documents', () => {

        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.clickSelectMainTypeDocument(0);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });

    it('should edit a main type resource', () => {

        ResourcesPage.clickEditMainTypeResource();
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest * 10);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('newIdentifier'));
    });

    it('should change the type of a resource to a child type', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        DocumentViewPage.getTypeCharacter().then(typeLabel => expect(typeLabel).toEqual('A'));
    });

    it('should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();

        DoceditPage.clickSelectOption('hasWallType', 1);
        DoceditPage.clickSaveDocument();
        DocumentViewPage.getFieldValue(0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DocumentViewPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseMessage();
        DoceditPage.clickSaveDocument();
        DocumentViewPage.getTypeCharacter().then(typeLabel => expect(typeLabel).toEqual('S'));
        browser.wait(EC.stalenessOf(DocumentViewPage.getFieldElement(0)));
    });

    it('should delete invalid relations when changing the type of a resource to a sibling type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'wall_surface');
        ResourcesPage.performCreateRelation('1', '2', 9);
        ResourcesPage.clickSelectResource('2');
        DocumentViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        DocumentViewPage.getRelationValue(1).then(relationValue => expect(relationValue).toEqual('1'));
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        DocumentViewPage.getRelationValue(1).then(relationValue => expect(relationValue).toEqual('2'));
        DocumentViewPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-layer');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern '
            + 'verloren gehen: Trägt');
        NavbarPage.clickCloseMessage();
        DoceditPage.clickSaveDocument();
        DocumentViewPage.getTypeCharacter().then(typeLabel => expect(typeLabel).toEqual('E'));
        DocumentViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        ResourcesPage.clickSelectResource('2');
        DocumentViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
    });
});
