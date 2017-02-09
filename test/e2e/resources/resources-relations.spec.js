var resourcesPage = require('./resources.page');

describe('relations', function() {

    beforeEach(function(done) {
        resourcesPage.get().then(function(){
            done();
        });
    });

    it ('should create links for relations', function(done) {
        resourcesPage.createResource('o1')
            .then(function(){return resourcesPage.createResource('o2')})
            .then(resourcesPage.scrollDown)
            .then(function(){return resourcesPage.clickAddRelationForGroupWithIndex(0)})
            .then(function(){return resourcesPage.typeInRelationByIndices(0, 0, 'o1')})
            .then(function(){return resourcesPage.clickRelationSuggestionByIndices(0, 0, 0)})
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveDocument)
            .then(function(){return resourcesPage.selectObjectByIndex(1)})
            .then(function(){
                expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o2');
                return resourcesPage.clickRelationInDocumentView(0);
            })
            .then(function(){
                expect(resourcesPage.getRelationNameInDocumetView(0)).toEqual('o1');
                done();
            })
    });


    it('should create a new relation and the corresponding inverse relation', function(done) {
        resourcesPage.createResource('o1')
            .then(function(){return resourcesPage.createResource('o2')})
            .then(resourcesPage.scrollDown)
            .then(function(){return resourcesPage.clickAddRelationForGroupWithIndex(0)})
            .then(function(){return resourcesPage.typeInRelationByIndices(0, 0, 'o1')})
            .then(function(){return resourcesPage.clickRelationSuggestionByIndices(0, 0, 0)})
            .then(function() {
                expect(resourcesPage.getRelationButtonTextByIndices(0, 0, 0)).toEqual('o1');
                return resourcesPage.scrollUp()
            })
            .then(resourcesPage.clickSaveDocument)
            .then(resourcesPage.selectObjectByIndex(1))
            .then(resourcesPage.clickEditDocument)
            .then(function() {
                expect(resourcesPage.getRelationButtonTextByIndices(1, 0, 0)).toEqual('o2');
                done();
            });
    });

});
