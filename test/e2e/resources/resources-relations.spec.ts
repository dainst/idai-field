import {NavbarPage} from '../navbar.page';
import {browser, protractor, element, by} from 'protractor';
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

const resourcesPage = require('./resources.page');
import {DocumentViewPage} from '../widgets/document-view.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';


describe('resources/relations --', function() {

    beforeEach(function() {
        resourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
    });

    it ('create links for relations', function() {
        resourcesPage.performCreateLink();
        resourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelationValue(0).then(relVal=>{
            expect(relVal).toEqual('2')
        });
        DocumentViewPage.clickRelation(0);
        DocumentViewPage.getRelationValue(0).then(relVal=>{
            expect(relVal).toEqual('1')
        });
    });

    it('create a new relation and the corresponding inverse relation', function() {
        resourcesPage.performCreateLink();
        resourcesPage.openEditByDoubleClickResource('2');
        expect(DocumentEditWrapperPage.getRelationButtonText(1, 0, 0)).toEqual('1');
        DocumentEditWrapperPage.clickCloseEdit();
        resourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        expect(DocumentEditWrapperPage.getRelationButtonText(2, 0, 0)).toEqual('2');
    });

    it('edit a resource that contains a relation', function() {
        resourcesPage.performCreateLink();
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        resourcesPage.openEditByDoubleClickResource('2');
        DocumentEditWrapperPage.clickFieldsTab();
        DocumentEditWrapperPage.typeInInputField('123');
        DocumentEditWrapperPage.clickSaveDocument();
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('delete a relation and the corresponding inverse relation', function() {
        resourcesPage.performCreateLink();
        resourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        resourcesPage.clickSelectResource('2');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickRelationDeleteButtonByIndices(1, 0, 0);
        DocumentEditWrapperPage.clickSaveDocument();
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
        resourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

    it('delete inverse relations when deleting a resource', function() {
        resourcesPage.performCreateLink();
        resourcesPage.openEditByDoubleClickResource('2');
        resourcesPage.clickDeleteDocument();
        resourcesPage.clickDeleteInModal();
        resourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

});
