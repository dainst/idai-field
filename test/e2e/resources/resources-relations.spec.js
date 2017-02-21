var resourcesPage = require('./resources.page');
var documentViewPage = require('../widgets/document-view.page');

describe('relations', function() {

    beforeEach(function() {
        resourcesPage.get();
    });

    it ('should create links for relations', function() {
        resourcesPage.createResource('o1');
        resourcesPage.createResource('o2');
        resourcesPage.scrollDown();
        resourcesPage.clickAddRelationForGroupWithIndex(0);
        resourcesPage.typeInRelationByIndices(0, 0, 'o1');
        resourcesPage.clickRelationSuggestionByIndices(0, 0, 0);
        resourcesPage.scrollUp();
        resourcesPage.clickSaveDocument();
        resourcesPage.selectObjectByIndex(1);
        expect(documentViewPage.getRelationName(0)).toEqual('o2');
        resourcesPage.clickRelationInDocumentView(0);
        expect(documentViewPage.getRelationName(0)).toEqual('o1');
    });


    it('should create a new relation and the corresponding inverse relation', function() {
        resourcesPage.createResource('o1');
        resourcesPage.createResource('o2');
        resourcesPage.scrollDown();
        resourcesPage.clickAddRelationForGroupWithIndex(0);
        resourcesPage.typeInRelationByIndices(0, 0, 'o1');
        resourcesPage.clickRelationSuggestionByIndices(0, 0, 0);
        expect(resourcesPage.getRelationButtonTextByIndices(0, 0, 0)).toEqual('o1');
        resourcesPage.scrollUp();
        resourcesPage.clickSaveDocument();
        resourcesPage.selectObjectByIndex(1);
        resourcesPage.clickEditDocument();
        expect(resourcesPage.getRelationButtonTextByIndices(1, 0, 0)).toEqual('o2');
    });

    it('should edit a resource that contains a relation', function() {
        resourcesPage.createResource('o1');
        resourcesPage.createResource('o2');
        resourcesPage.scrollDown();
        resourcesPage.clickAddRelationForGroupWithIndex(0);
        resourcesPage.typeInRelationByIndices(0, 0, 'o1');
        resourcesPage.clickRelationSuggestionByIndices(0, 0, 0);
        resourcesPage.scrollUp();
        resourcesPage.clickSaveDocument();
        resourcesPage.clickCloseMessage();
        resourcesPage.typeInIdentifier('123');
        resourcesPage.clickSaveDocument();
        expect(resourcesPage.getMessage()).toContain('erfolgreich');
    });

    it('should delete a relation and the corresponding inverse relation', function() {
        resourcesPage.createResource('o1');
        resourcesPage.createResource('o2');
        resourcesPage.scrollDown();
        resourcesPage.clickAddRelationForGroupWithIndex(0);
        resourcesPage.typeInRelationByIndices(0, 0, 'o1');
        resourcesPage.clickRelationSuggestionByIndices(0, 0, 0);
        resourcesPage.scrollUp();
        resourcesPage.clickSaveDocument();
        resourcesPage.scrollDown();
        resourcesPage.clickRelationDeleteButtonByIndices(0, 0, 0);
        resourcesPage.scrollUp();
        resourcesPage.clickSaveDocument();
        resourcesPage.clickBackToDocumentView();
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
        resourcesPage.selectObjectByIndex(1);
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

});
