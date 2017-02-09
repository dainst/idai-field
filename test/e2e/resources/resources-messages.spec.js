var resourcesPage = require('./resources.page');

describe('resources/messages', function() {

    beforeEach(function(done){
        resourcesPage.get().then(function(){
            done();
        })
    });

    it('should create a new object of first listed type ', function() {
        resourcesPage.createResource('12')
            .then(expect(resourcesPage.getMessage()).toContain('erfolgreich'));
    });

    it('should show the success msg also on route change', function() {
        resourcesPage.createResource('12')
            .then(resourcesPage.clickCloseMessage)
            .then(resourcesPage.typeInIdentifier('34'))
            .then(resourcesPage.selectObjectByIndex(0))
            .then(resourcesPage.clickSaveInModal)
            .then(expect(resourcesPage.getMessage()).toContain('erfolgreich'));
    });
    
    it('should warn if identifier is missing', function () {
        resourcesPage.createResource('')
            .then(expect(resourcesPage.getMessage()).toContain('identifier'));
    });

    it('should warn if an existing id is used', function() {
        resourcesPage.createResource('12')
            .then(resourcesPage.createResource('12'))
            .then(expect(resourcesPage.getMessage()).toContain('existiert bereits'));
    });
});