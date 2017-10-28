import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {DoceditPage} from '../docedit/docedit.page';


fdescribe('resources/messages --', () => {

    beforeEach(() => {
        ResourcesPage.get();
    });

    it('create a new object of first listed type ', () => {
        ResourcesPage.performCreateResource('12');
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('show the success msg also on route change', () => {
        ResourcesPage.performCreateResource('12');
        ResourcesPage.openEditByDoubleClickResource('12');
        DoceditPage.typeInInputField('identifier', '34');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
    
    it('warn if identifier is missing', () => {
        ResourcesPage.performCreateResource('', 'feature', 'shortDescription', 'Text');

        NavbarPage.awaitAlert('identifier', false)
    });

    it('warn if an existing identifier is used', () => {
        ResourcesPage.performCreateResource('12');
        ResourcesPage.performCreateResource('12');

        NavbarPage.awaitAlert('existiert bereits', false);
    });

    it('do not warn if two different identifiers start with the same string', () => {
        ResourcesPage.performCreateResource('120');
        ResourcesPage.performCreateResource('12');

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
});