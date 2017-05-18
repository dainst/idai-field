import {browser,protractor,element,by} from 'protractor';

import {NavbarPage} from '../navbar.page';

let resourcesPage = require('../resources/resources.page');
let listPage = require('./list.page');
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


/**
 * @author Fabian Z
 */
describe('listpage tests --', function() {

    it('should find resource by its identifier', function() {
        resourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id("idai-field-brand"))), delays.ECWaitTime);
        resourcesPage.performCreateResource('1');

        NavbarPage.clickNavigateToList();

        browser.wait(EC.visibilityOf(element(by.id("idai-field-brand"))), delays.ECWaitTime);
        browser.wait(EC.presenceOf(listPage.getListItemEl('1')),delays.ECWaitTime);
    });


    it('should change an identifier of a resource', function() {
        resourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id("idai-field-brand"))), delays.ECWaitTime);
        resourcesPage.performCreateResource('1');

        NavbarPage.clickNavigateToList();

        browser.wait(EC.visibilityOf(element(by.id("idai-field-brand"))), delays.ECWaitTime);

        listPage.typeIntoIdentifierInputForResource('1', 'b');
        browser.wait(EC.presenceOf(listPage.getListItemEl('b')),delays.ECWaitTime);

        NavbarPage.clickNavigateToResources();

        resourcesPage.typeInIdentifierInSearchField('b');
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('b')),delays.ECWaitTime);
    });

});
