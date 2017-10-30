import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {DoceditPage} from '../docedit/docedit.page';
import {browser, protractor, element, by} from 'protractor';

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

describe('resources/messages --', () => {

    beforeEach(() => {
        ResourcesPage.get();
    });

    it('create a new object of first listed type ', () => {
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('show the success msg also on route change', () => {
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.openEditByDoubleClickResource('12');
        DoceditPage.typeInInputField('identifier', '34');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
    
    it('warn if identifier is missing', () => {
        ResourcesPage.performCreateResource('', 'feature', 'shortDescription', 'Text', undefined, false);

        NavbarPage.awaitAlert('identifier', false)
    });

    it('warn if an existing identifier is used', () => {
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);

        NavbarPage.awaitAlert('existiert bereits', false);
    });

    it('do not warn if two different identifiers start with the same string', () => {
        ResourcesPage.performCreateResource('120',undefined,undefined,undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });
});