var resourcesPage = require('./resources.page');

describe('resources/messages', function() {

    beforeEach(function(){
        resourcesPage.get();
    });

    it('should create a new object of first listed type ', function() {
        resourcesPage.createResource('12');
        expect(resourcesPage.getMessage()).toContain('erfolgreich');
    });

    it('should show the success msg also on route change', function() {
        resourcesPage.createResource('12');
        resourcesPage.clickCloseMessage();
        resourcesPage.typeInIdentifier('34');
        resourcesPage.selectObjectByIndex(0);
        resourcesPage.clickSaveInModal();
        expect(resourcesPage.getMessage()).toContain('erfolgreich');
    });
    
    it('should warn if identifier is missing', function () {
        resourcesPage.createResource('');
        expect(resourcesPage.getMessage()).toContain('identifier');
    });

    it('should warn if an existing id is used', function() {
        resourcesPage.createResource('12');
        resourcesPage.createResource('12');
        expect(resourcesPage.getMessage()).toContain('existiert bereits');
    });
});