var resourcesPage = require('./resources.page');

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
        expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o2');
        resourcesPage.clickRelationInDocumentView(0);
        expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o1');
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

});
