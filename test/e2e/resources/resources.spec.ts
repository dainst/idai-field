import {browser, protractor, element, by} from 'protractor';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';

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

    it('find it by its identifier', () => {
        ResourcesPage.performCreateResource('1');
        ResourcesPage.typeInIdentifierInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')),delays.ECWaitTime);
    });

    it('show only resources of the selected type', () => {
        ResourcesPage.performCreateResource('1', 0);
        ResourcesPage.performCreateResource('2', 1);
        ResourcesPage.clickChooseTypeFilter(1);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        ResourcesPage.clickChooseTypeFilter(0);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        ResourcesPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime)
    });

    it('not reflect changes in overview in realtime', () => {
        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInInputField('1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1a')});
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of 'Neues Objekt' for every time the button was pressed.
     */
    it('remove a new object from the list if it has not been saved', () => {
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
    });

    it('should save changes via dialog modal', () => {
        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInInputField('2');
        DocumentEditWrapperPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();
        browser.sleep(1000);
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('2')});
    });

    it('should discard changes via dialog modal', () => {
        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInInputField('2');
        DocumentEditWrapperPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1')});
    });

    it('should cancel dialog modal', () => {
        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.typeInInputField('2');
        DocumentEditWrapperPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DocumentEditWrapperPage.getInputFieldValue(0)).toEqual('2');
    });

    it('should delete a resource', () => {
        ResourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        ResourcesPage.clickDeleteDocument();
        ResourcesPage.clickDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });

    it('should create a new main type resource', () => {
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('newTrench'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });

    it('should edit a main type resource', () => {
        ResourcesPage.clickEditMainTypeResource();
        DocumentEditWrapperPage.typeInInputField('newIdentifier');
        DocumentEditWrapperPage.clickSaveDocument();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('newIdentifier'));
    });

    xit('should delete a main type resource', () => {
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.clickEditMainTypeResource();
        ResourcesPage.clickDeleteDocument();
        ResourcesPage.clickDeleteInModal();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.clickEditMainTypeResource();
        ResourcesPage.clickDeleteDocument();
        ResourcesPage.clickDeleteInModal();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value.length).toBe(0));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });
});
