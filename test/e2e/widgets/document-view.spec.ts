import {browser, protractor, element, by} from 'protractor';
import {DocumentEditWrapperPage} from './document-edit-wrapper.page';
import {DocumentViewPage} from '../widgets/document-view.page';

import {ResourcesPage} from '../resources/resources.page';
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('document view --', function() {

    beforeEach(function() {
        ResourcesPage.get();
    });

    it('show the fields present in the object', function() {
        ResourcesPage.performCreateResource('1', 1, 'no', 2);
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getFieldName(0).then(val=>{
            expect(val).toBe('Nummer'); // with the correct field label
        });
        DocumentViewPage.getFieldValue(0).then(val=>{
            expect(val).toBe('no');
        });
    });

    /**
     * Addresses an issue where fields were shown double.
     */
    it('show only the fields present in the object', function() {
        ResourcesPage.performCreateResource('1', 1, 'no', 2);
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });

    it('show the relations present in the object', function() {
        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelationName(0).then(val=>{
            expect(val).toBe('Zeitlich nach'); // with the correct relation label
        });
        DocumentViewPage.getRelationValue(0).then(val=>{
            expect(val).toBe('2');
        });
    });

    /**
     * Addresses an issue where relations were shown double.
     */
    it('show only relations present in the object', function() {
        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });

    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('show no relations after cancelling edit', function() {
        ResourcesPage.performCreateResource('1', 0);
        ResourcesPage.performCreateResource('2', 0);
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();
        DocumentEditWrapperPage.clickRelationsTab();
        DocumentEditWrapperPage.clickAddRelationForGroupWithIndex(1);
        DocumentEditWrapperPage.typeInRelationByIndices(1, 0, '2');
        DocumentEditWrapperPage.clickChooseRelationSuggestion(1, 0, 0);
        DocumentEditWrapperPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.tagName('document-view'))), delays.ECWaitTime);
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });
});