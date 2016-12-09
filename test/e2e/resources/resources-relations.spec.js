var resourcesPage = require('./resources.page');

describe('relations', function() {

    beforeEach(function() {
        resourcesPage.get();
    });

    it ('should create links for relations', function() {
        resourcesPage.createResource('o1')
            .then(resourcesPage.createResource('o2'))
            .then(resourcesPage.scrollDown)
            .then(resourcesPage.clickAddRelationForGroupWithIndex(0))
            .then(resourcesPage.typeInRelationByIndices(0, 0, 'o1'))
            .then(resourcesPage.clickRelationSuggestionByIndices(0, 0, 0))
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveDocument)
            .then(resourcesPage.selectObjectByIndex(1))
            .then(function(){
                expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o2');
                return resourcesPage.clickRelationInDocumentView(0);
            })
            .then(function(){
                expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o1');
            })
    });


    it('should create a new relation and the corresponding inverse relation', function() {
        resourcesPage.createResource('o1')
            .then(resourcesPage.createResource('o2'))
            .then(resourcesPage.scrollDown)
            .then(resourcesPage.clickAddRelationForGroupWithIndex(0))
            .then(resourcesPage.typeInRelationByIndices(0, 0, 'o1'))
            .then(resourcesPage.clickRelationSuggestionByIndices(0, 0, 0))
            .then(function() {
                expect(resourcesPage.getRelationButtonTextByIndices(0, 0, 0)).toEqual('o1');
                return resourcesPage.scrollUp()
            })
            .then(resourcesPage.clickSaveDocument)
            .then(resourcesPage.selectObjectByIndex(1))
            .then(resourcesPage.clickEditDocument)
            .then(function() {
                expect(resourcesPage.getRelationButtonTextByIndices(1, 0, 0)).toEqual('o2');
            });
    });

});
