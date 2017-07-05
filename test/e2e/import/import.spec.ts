import {browser, protractor, element, by} from 'protractor';

let common = require('../common.js');
import {ImportPage} from './import.page';
let resourcesPage = require('../resources/resources.page');
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
let delays = require('../config/delays');

let EC = protractor.ExpectedConditions;


describe('import --', function() {

    beforeEach(function() {

        ImportPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
    });

    let importIt = function(url) {

        expect(ImportPage.getSourceOptionValue(1)).toEqual('http');
        ImportPage.clickSourceOption(1);
        expect(ImportPage.getFormatOptionValue(0)).toEqual('native');
        ImportPage.clickFormatOption(0);
        common.typeIn(ImportPage.getImportURLInput(), url);
        ImportPage.clickStartImportButton();
    };

    xit('import a valid iDAI.field JSONL file via HTTP', function() {

        importIt('./test/test-data/importer-test-ok.jsonl');
        browser.sleep(2000);
        NavbarPage.clickNavigateToResources();

        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob4')), delays.ECWaitTime);
    });

    it('delete already imported iDAI.field documents if an error occurs', function() {

        importIt('./test/test-data/importer-test-constraint-violation.jsonl');

        NavbarPage.awaitAlert('existiert bereits', false);
        element(by.css('.alert button')).click();
        NavbarPage.clickNavigateToResources();

        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob1');
        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob2');
    });

    it('abort if an empty geometry is found', function() {

        importIt('./test/test-data/importer-test-empty-geometry.jsonl');
        NavbarPage.awaitAlert('nicht definiert', false);
    });

    it('abort if a geometry with invalid coordinates is found', function() {

        importIt('./test/test-data/importer-test-invalid-geometry-coordinates.jsonl');
        NavbarPage.awaitAlert('sind nicht valide', false);
    });

    it('abort if a geometry with an unsupported type is found', function() {

        importIt('./test/test-data/importer-test-unsupported-geometry-type.jsonl');
        NavbarPage.awaitAlert('nicht unterstützt', false);
    });

    xit('import a relation and add the corresponding inverse relation', function() {

        importIt('./test/test-data/importer-test-relation-ok.jsonl');
        browser.sleep(2000);
        NavbarPage.clickNavigateToResources();

        resourcesPage.clickSelectResource('obob1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        DocumentViewPage.getRelationValue(0).then(function(relationValue) {
            expect(relationValue).toContain('testf1');
        });
        DocumentViewPage.getRelationName(0).then(function(relationName) {
            expect(relationName).toEqual('Zeitlich vor');
        });

        resourcesPage.clickSelectResource('testf1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        DocumentViewPage.getRelationValue(0).then(function(relationValue) {
            expect(relationValue).toContain('obob1');
        });
        DocumentViewPage.getRelationName(0).then(function(relationName) {
            expect(relationName).toEqual('Zeitlich nach');
        });
    });

    xit('abort if a relation target cannot be found and remove all imported resources & already '
            + 'created inverse relations', function() {

        importIt('./test/test-data/importer-test-relation-error.jsonl');
        NavbarPage.awaitAlert('konnte nicht gefunden werden', false);

        NavbarPage.clickCloseMessage();
        NavbarPage.clickNavigateToResources();

        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob1');
        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob2');

        resourcesPage.clickSelectResource('testf1');
        DocumentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

});
