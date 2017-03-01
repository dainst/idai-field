import {NavbarPage} from '../navbar.page';

let resourcesPage = require('./resources.page');
let documentViewPage = require('../widgets/document-view.page');
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';

describe('relations', function() {

    beforeEach(function() {
        resourcesPage.get();
    });

    it ('should create links for relations', function() {
        resourcesPage.performCreateLink();
        resourcesPage.clickSelectResource('1');
        expect(documentViewPage.getRelationValue(0)).toEqual('2');
        documentViewPage.clickRelation(0);
        expect(documentViewPage.getRelationValue(0)).toEqual('1');
    });

    it('should create a new relation and the corresponding inverse relation', function() {
        resourcesPage.performCreateLink();
        expect(DocumentEditWrapperPage.getRelationButtonText(0, 0, 0)).toEqual('1');
        resourcesPage.clickSelectResource('1');
        documentViewPage.clickEditDocument();
        expect(DocumentEditWrapperPage.getRelationButtonText(1, 0, 0)).toEqual('2');
    });

    it('should edit a resource that contains a relation', function() {
        resourcesPage.performCreateLink();
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        DocumentEditWrapperPage.clickFieldsTab();
        DocumentEditWrapperPage.typeInIdentifier('123');
        DocumentEditWrapperPage.clickSaveDocument();
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('should delete a relation and the corresponding inverse relation', function() {
        resourcesPage.performCreateLink();
        resourcesPage.clickSelectResource('2');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        resourcesPage.clickSelectResource('2');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        documentViewPage.clickEditDocument();
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickRelationDeleteButtonByIndices(0, 0, 0);

        DocumentEditWrapperPage.clickSaveDocument();
        DocumentEditWrapperPage.clickBackToDocumentView();
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
        resourcesPage.clickSelectResource('1');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

    it('should delete inverse relations when deleting a resource', function() {
        resourcesPage.performCreateLink();
        resourcesPage.clickDeleteDocument();
        resourcesPage.clickDeleteInModal();
        resourcesPage.clickSelectResource('1');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

});
