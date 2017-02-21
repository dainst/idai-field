var resourcesPage = require('../resources/resources.page');
var documentViewPage = require('./document-view.page');
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('resources view tests --', function() {

    beforeEach(function () {
        resourcesPage.get();
    });

    it('fields view should show the fields present in the object', function () {
        resourcesPage.createResource('1', 0);
        resourcesPage.selectObjectByIndex(0);
        expect(documentViewPage.getFieldName(0)).toBe('Identifier'); // with the correct field label
        expect(documentViewPage.getFieldValue(0)).toBe('1');
    });

    /**
     * Addresses an issue where fields were shown double.
     */
    it('fields view should show only the fields present in the object', function () {
        resourcesPage.createResource('1', 0);
        resourcesPage.selectObjectByIndex(0);
        documentViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });

    it('fields view should show the relations present in the object', function () {
        resourcesPage.createLink();
        resourcesPage.selectObjectByIndex(1);
        expect(documentViewPage.getRelationName(0)).toBe('Sohn von'); // with the correct relation label
        expect(documentViewPage.getRelationValue(0)).toBe('2');
    });

    /**
     * Addresses an issue where relations were shown double.
     */
    it('fields view should show only relations present in the object', function () {
        resourcesPage.createLink();
        resourcesPage.selectObjectByIndex(1);
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });
});