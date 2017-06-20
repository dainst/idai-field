import {NavbarPage} from '../navbar.page';

let delays = require('../config/delays');
let resourcesPage = require('./resources.page');


describe('resources/list --', function() {

    beforeEach(function () {
        resourcesPage.get();
        resourcesPage.clickListModeButton();
    });

    it('show newly created resource in list view', function() {
        resourcesPage.performCreateResource('1', 0, 'Resource 1', 1);

        resourcesPage.getListModeInputFieldValue('1', 0).then(
            inputValue => { expect(inputValue).toEqual('1'); }
        );

        resourcesPage.getListModeInputFieldValue('1', 1).then(
            inputValue => { expect(inputValue).toEqual('Resource 1'); }
        );
    });

    it('save changes on input blur', function() {
        resourcesPage.performCreateResource('1', 0, 'Resource 1', 1);
        resourcesPage.performCreateResource('2', 0, 'Resource 2', 1);

        resourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        resourcesPage.getListModeInputField('2', 0).click();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('restore identifier from database if a duplicate identifier is typed in', function() {
        resourcesPage.performCreateResource('1', 0, 'Resource 1', 1);
        resourcesPage.performCreateResource('2', 0, 'Resource 2', 1);
        resourcesPage.performCreateResource('3', 0, 'Resource 3', 1);

        resourcesPage.typeInListModeInputField('2', 0, '1');
        resourcesPage.getListModeInputField('3', 0).click();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');

        resourcesPage.getListModeInputFieldValue('2', 0).then(
            inputValue => { expect(inputValue).toEqual('2'); }
        );
    });
});