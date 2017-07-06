import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';


describe('resources/messages --', function() {

    beforeEach(function() {
        ResourcesPage.get();
    });

    it('create a new object of first listed type ', function() {
        ResourcesPage.performCreateResource('12');
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('show the success msg also on route change', function() {
        ResourcesPage.performCreateResource('12');
        ResourcesPage.openEditByDoubleClickResource('12');
        DocumentEditWrapperPage.typeInInputField('34');
        DocumentEditWrapperPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
    
    it('warn if identifier is missing', function() {
        ResourcesPage.performCreateResource('');

        NavbarPage.awaitAlert('identifier',false)
    });

    it('warn if an existing id is used', function() {
        ResourcesPage.performCreateResource('12');
        ResourcesPage.performCreateResource('12');

        NavbarPage.awaitAlert('existiert bereits',false);
    });
});