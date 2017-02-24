import {browser,protractor,element,by} from 'protractor';

var resourcesPage = require('./resources.page');

describe('resources/messages', function() {

    beforeEach(function(){
        resourcesPage.get();
    });

    it('should create a new object of first listed type ', function() {
        resourcesPage.performCreateResource('12');
        expect(resourcesPage.getMessageText()).toContain('erfolgreich');
    });

    it('should show the success msg also on route change', function() {
        resourcesPage.performCreateResource('12');
        resourcesPage.clickCloseMessage();
        resourcesPage.typeInIdentifier('34');
        resourcesPage.clickSelectResource('34');
        resourcesPage.clickSaveInModal();
        expect(resourcesPage.getMessageText()).toContain('erfolgreich');
    });
    
    it('should warn if identifier is missing', function () {
        resourcesPage.performCreateResource('');
        expect(resourcesPage.getMessageText()).toContain('identifier');
    });

    it('should warn if an existing id is used', function() {
        resourcesPage.performCreateResource('12');
        resourcesPage.performCreateResource('12');
        expect(resourcesPage.getMessageText()).toContain('existiert bereits');
    });
});