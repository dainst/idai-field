let resourcesPage = require('./resources.page');
import {NavbarPage} from '../navbar.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';

describe('resources/messages', function() {

    beforeEach(function(){
        resourcesPage.get();
    });

    it('should create a new object of first listed type ', function() {
        resourcesPage.performCreateResource('12');    
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    xit('should show the success msg also on route change', function() {
        resourcesPage.performCreateResource('12');
        DocumentEditWrapperPage.typeInInputField('34');
        resourcesPage.clickSelectResource('34');
        resourcesPage.clickSaveInModal();
        
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
    
    it('should warn if identifier is missing', function () {
        resourcesPage.performCreateResource('');

        NavbarPage.awaitAlert('identifier',false)
    });

    it('should warn if an existing id is used', function() {
        resourcesPage.performCreateResource('12');
        resourcesPage.performCreateResource('12');

        NavbarPage.awaitAlert('existiert bereits',false);
    });
});