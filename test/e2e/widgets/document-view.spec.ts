import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {DocumentViewPage} from '../widgets/document-view.page';

import {ResourcesPage} from '../resources/resources.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {NavbarPage} from '../navbar.page';
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
fdescribe('widgets/document-view', function() {

    beforeEach(function() {

        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
        browser.sleep(250);
    });

    beforeEach(() => {
        NavbarPage.performNavigateToSettings();
        require('request').post('http://localhost:3003/reset', {});
        browser.sleep(delays.shortRest * 5);
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest);
    });


    /**
     * Addresses an issue where relations were shown double.
     */
    it('show only relations present in the object', function() {
        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(2);
        });
    });

    it('show the relations present in the object', function() {
        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelationName(1).then(value => {
            expect(value).toBe('Liegt in'); // with the correct relation label
        });
        DocumentViewPage.getRelationValue(1).then(value => {
            expect(value).toBe('2');
        });
    });

    it('show the fields present in the object', function() {
        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getFieldName(0).then(value => {
            expect(value).toBe('Fläche in m2'); // with the correct field label
        });
        DocumentViewPage.getFieldValue(0).then(value => {
            expect(value).toBe('100');
        });
    });

    /**
     * Addresses an issue where fields were shown double.
     */
    it('show only the fields present in the object', function() {
        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });

    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('show no relations after cancelling edit', function() {
        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(1);
        DoceditRelationsTabPage.typeInRelationByIndices(1, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(1, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.tagName('document-view'))), delays.ECWaitTime);
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });
});