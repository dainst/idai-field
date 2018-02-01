import {browser, protractor, element, by} from 'protractor';
import {ResourcesPage} from './resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {NavbarPage} from '../navbar.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('resources/relations --', () => {

    let i = 0;


    beforeAll(function() {

        ResourcesPage.get();
        browser.sleep(delays.shortRest);
    });


    beforeEach(() => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
        }
        i++;
    });


    it('create links for relations', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationValue(0).then(relVal => expect(relVal).toEqual('2'));
        RelationsViewPage.clickRelation(0);
        RelationsViewPage.getRelationValue(0).then(relVal => expect(relVal).toEqual('1'));
    });


    it('create a new relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText(4, 0, 0)).toEqual('1');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        expect(DoceditRelationsTabPage.getRelationButtonText(5, 0, 0)).toEqual('2');
        DoceditPage.clickCloseEdit();

    });


    it('edit a resource that contains a relation', () => {

        ResourcesPage.performCreateLink();
        // expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickFieldsTab();
        DoceditPage.typeInInputField('identifier', '123');
        DoceditPage.clickSaveDocument();
        // expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('delete a relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(4, 0, 0);
        DoceditPage.clickSaveDocument();
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    it('delete inverse relations when deleting a resource', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('2');
        DoceditPage.clickConfirmDeleteInModal();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });
});
