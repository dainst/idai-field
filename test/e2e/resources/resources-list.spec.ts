import {NavbarPage} from '../navbar.page';

let delays = require('../config/delays');
import {ResourcesPage} from './resources.page';

xdescribe('resources/list --', function() {

    beforeEach(function () {
        ResourcesPage.get();
        ResourcesPage.clickListModeButton();
    });

    it('show newly created resource in list view', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1);

        ResourcesPage.getListModeInputFieldValue('1', 0).then(
            inputValue => { expect(inputValue).toEqual('1'); }
        );

        ResourcesPage.getListModeInputFieldValue('1', 1).then(
            inputValue => { expect(inputValue).toEqual('Resource 1'); }
        );
    });

    it('save changes on input field blur', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1);
        ResourcesPage.performCreateResource('2', 0, 'Resource 2', 1);

        ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        ResourcesPage.getListModeInputField('2', 0).click();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('restore identifier from database if a duplicate identifier is typed in', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1);
        ResourcesPage.performCreateResource('2', 0, 'Resource 2', 1);
        ResourcesPage.performCreateResource('3', 0, 'Resource 3', 1);

        ResourcesPage.typeInListModeInputField('2', 0, '1');
        ResourcesPage.getListModeInputField('3', 0).click();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');

        ResourcesPage.getListModeInputFieldValue('2', 0).then(
            inputValue => { expect(inputValue).toEqual('2'); }
        );
    });
});