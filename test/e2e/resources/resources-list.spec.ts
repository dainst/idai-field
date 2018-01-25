import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

describe('resources/list --', () => {

    let index = 0;


    beforeAll(function() {
        ResourcesPage.get();
        ResourcesPage.clickListModeButton();
    });


    beforeEach(() => {
        if (index > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
            ResourcesPage.clickListModeButton();
        }
        index++;
    });


    it('show newly created resource in list view', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.getListModeInputFieldValue('1', 0).then(inputValue => expect(inputValue).toEqual('1'));
    });


    it('save changes on input field blur', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        ResourcesPage.getListModeInputField('2', 0).click();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        NavbarPage.clickCloseAllMessages();
    });


    it('navigate to child item view in list mode and create a new child object', () => {

        ResourcesPage.performCreateResourceInList('5', 'feature-architecture');
        ResourcesPage.clickMoveIntoButton('5');
        ResourcesPage.performCreateResourceInList('child1', 'find');
        NavbarPage.clickNavigateToProject();
        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListModeInputFieldValue('child1', 0).then(inputValue => expect(inputValue).toEqual('child1'));
    });


    it('restore identifier from database if a duplicate identifier is typed in', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('2', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('3', 'feature-architecture');

        ResourcesPage.typeInListModeInputField('2', 0, '1');
        ResourcesPage.getListModeInputField('3', 0).click();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');

        ResourcesPage.getListModeInputFieldValue('2', 0).then(inputValue => expect(inputValue).toEqual('2'));
        NavbarPage.clickCloseAllMessages();

    });


    it('perform a fulltext search', () => {

        ResourcesPage.performCreateResourceInList('context2', 'feature');

        SearchBarPage.typeInSearchField('context1');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField('context2');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField('abc');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);
    });


    it('perform a type filter search', () => {

        ResourcesPage.performCreateResourceInList('testf2', 'find');

        SearchBarPage.clickChooseTypeFilter('find');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf2')), delays.ECWaitTime);

        SearchBarPage.clickChooseTypeFilter('processunit');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf2')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
    });
});