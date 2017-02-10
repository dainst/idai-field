var resourcesPage = require('./resources.page');

describe('resources/messages', function() {

    beforeEach(function(done){
        resourcesPage.get().then(function(){
            done();
        })
    });

    it('should create a new object of first listed type ', function(done) {
        resourcesPage.createResource('12')
            .then(function(){
                expect(resourcesPage.getMessage()).toContain('erfolgreich');
                done();
            });
    });

    it('should show the success msg also on route change', function(done) {
        resourcesPage.createResource('12')
            .then(resourcesPage.clickCloseMessage)
            .then(function(){return resourcesPage.typeInIdentifier('34')})
            .then(function(){return resourcesPage.selectObjectByIndex(0)})
            .then(resourcesPage.clickSaveInModal)
            .then(function(){
                expect(resourcesPage.getMessage()).toContain('erfolgreich');
                done();
            });
    });
    
    it('should warn if identifier is missing', function (done) {
        resourcesPage.createResource('')
            .then(function(){
                expect(resourcesPage.getMessage()).toContain('identifier');
                done();
            });
    });

    it('should warn if an existing id is used', function(done) {
        resourcesPage.createResource('12')
            .then(function(){return resourcesPage.createResource('12')})
            .then(function(){
                expect(resourcesPage.getMessage()).toContain('existiert bereits');
                done();
            });
    });
});