var resourcesPage = require('./resources.page');
var documentViewPage = require('../widgets/document-view.page');

describe('relations', function() {

    beforeEach(function() {
        resourcesPage.get();
    });

    it ('should create links for relations', function() {
        resourcesPage.createLink();
        resourcesPage.selectObjectByIndex(1);
        expect(documentViewPage.getRelationValue(0)).toEqual('2');
        resourcesPage.clickRelationInDocumentView(0);
        expect(documentViewPage.getRelationValue(0)).toEqual('1');
    });


    it('should create a new relation and the corresponding inverse relation', function() {
        resourcesPage.createLink();
        expect(resourcesPage.getRelationButtonTextByIndices(0, 0, 0)).toEqual('1');
        resourcesPage.selectObjectByIndex(1);
        resourcesPage.clickEditDocument();
        expect(resourcesPage.getRelationButtonTextByIndices(1, 0, 0)).toEqual('2');
    });

    it('should edit a resource that contains a relation', function() {
        resourcesPage.createLink();
        resourcesPage.clickCloseMessage();
        resourcesPage.typeInIdentifier('123');
        resourcesPage.clickSaveDocument();
        expect(resourcesPage.getMessage()).toContain('erfolgreich');
    });

    it('should delete a relation and the corresponding inverse relation', function() {
        resourcesPage.createLink();
        resourcesPage.selectObjectByIndex(0);
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        resourcesPage.selectObjectByIndex(0);
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        resourcesPage.clickEditDocument();
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
