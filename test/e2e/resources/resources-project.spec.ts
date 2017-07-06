import {browser} from "protractor";

import {NavbarPage} from "../navbar.page";
let resourcesPage = require('./resources.page');


/**
 * @author Daniel de Oliveira
 */
fdescribe('resources/project --', function() {

    beforeEach(function() {
        return browser.get('#/resources/project');
    });

    it('basic stuff',()=>{
        resourcesPage.performCreateResource('trench2',0);

        NavbarPage.clickNavigateToResources();

        resourcesPage.selectMainType(1);
        resourcesPage.performCreateResource('befund1',0);


        resourcesPage.selectMainType(0);
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('context1');

        resourcesPage.selectMainType(1);
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('befund1');

        NavbarPage.clickNavigateToProject();
        expect(resourcesPage.getListItemIdentifierText(0)).toEqual('trench2');
    })
});
