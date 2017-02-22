var resourcesPage = require('../resources/resources.page');
var documentViewPage = require('./document-view.page');
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('document view tests --', function() {

    beforeEach(function () {
        resourcesPage.get();
    });

    it('document view should show the fields present in the object', function () {
        resourcesPage.createResource('1', 0);
        resourcesPage.selectResourceByIdentifier("1");
        expect(documentViewPage.getFieldName(0)).toBe('Identifier'); // with the correct field label
        expect(documentViewPage.getFieldValue(0)).toBe('1');
    });

    /**
     * Addresses an issue where fields were shown double.
     */
    it('document view should show only the fields present in the object', function () {
        resourcesPage.createResource('1', 0);
        resourcesPage.selectResourceByIdentifier("1");
        documentViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });

    it('document view should show the relations present in the object', function () {
        resourcesPage.createLink();
        resourcesPage.selectResourceByIdentifier("1");
        expect(documentViewPage.getRelationName(0)).toBe('Sohn von'); // with the correct relation label
        expect(documentViewPage.getRelationValue(0)).toBe('2');
    });

    /**
     * Addresses an issue where relations were shown double.
     */
    it('document view should show only relations present in the object', function () {
        resourcesPage.createLink();
        resourcesPage.selectResourceByIdentifier("1");
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });

    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    xit('fields view should show only relations present in the object', function () {
        resourcesPage.createResource('1');
        resourcesPage.createResource('2');
        resourcesPage.selectResourceByIdentifier("1");
        resourcesPage.clickEditDocument();
        resourcesPage.clickAddRelationForGroupWithIndex(0);
        resourcesPage.typeInRelationByIndices(0, 0, '2');
        resourcesPage.clickRelationSuggestionByIndices(0, 0, 0);
        resourcesPage.selectResourceByIdentifier("1");
        resourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.tagName('document-view'))), delays.ECWaitTime); // to prove document view is visible
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });
});