import {browser, protractor} from 'protractor';
import {MenuPage} from '../menu.page';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';

const EC = protractor.ExpectedConditions;
const delays = require('../delays');
const common = require('../common');


describe('resources/multi-select --', () => {

    beforeEach(() => {

        browser.sleep(1000);

        MenuPage.navigateToSettings();
        common.resetApp();
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S1');
    });


    const createResources = () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.performCreateResource('2');
        ResourcesPage.performCreateResource('3');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('3')), delays.ECWaitTime);
    };


    const testDeletingResources = () => {

        ResourcesPage.clickOpenContextMenu('1');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('3')), delays.ECWaitTime);
    };


    it('delete multiple resources with control key selection', () => {

        createResources();
        common.click(ResourcesPage.getListItemEl('3'));
        common.clickWithControlKey(ResourcesPage.getListItemEl('2'));
        common.clickWithControlKey(ResourcesPage.getListItemEl('1'));
        testDeletingResources();
    });


    it('delete multiple resources with shift key selection', () => {

        createResources();
        common.click(ResourcesPage.getListItemEl('1'));
        common.clickWithShiftKey(ResourcesPage.getListItemEl('3'));
        testDeletingResources();
    });
});
