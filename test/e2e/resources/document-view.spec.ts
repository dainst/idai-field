import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';

import {ResourcesPage} from './resources.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {FieldsViewPage} from '../widgets/fields-view-page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('resources/docview', function() {

    beforeAll(() => {

        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
        browser.sleep(750);
    });


    beforeEach(() => {

        NavbarPage.performNavigateToSettings();
        require('request').post('http://localhost:3003/reset', {});
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest * 4);
        NavbarPage.clickNavigateToExcavation();
    });


    /**
     * Addresses an issue where relations were shown double.
     */
    it('show only relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });


    it('show the relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Wird geschnitten von'); // with the correct relation label
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('2');
        });
    });


    it('show the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFieldName(0).then(value => {
            expect(value).toBe('Fläche in m2'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0).then(value => {
            expect(value).toBe('100');
        });
    });


    /**
     * Addresses an issue where fields were shown double.
     */
    it('show only the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('show no relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(1);
        DoceditRelationsTabPage.typeInRelationByIndices(1, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(1, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar'))), delays.ECWaitTime);
        RelationsViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });
});