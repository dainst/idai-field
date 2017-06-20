import {browser, protractor, element, by} from 'protractor';

let common = require('../common.js');
let importPage = require('./import.page');
let resourcesPage = require('../resources/resources.page');
let documentViewPage = require('../widgets/document-view.page');
import {NavbarPage} from '../navbar.page';
let delays = require('../config/delays');

let EC = protractor.ExpectedConditions;


describe('import --', function() {

    beforeEach(function() {
        importPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
    });

    let importIt = function(url) {
        importPage.clickImportButton();
        expect(importPage.getSourceOptionValue(1)).toEqual('http');
        importPage.clickSourceOption(1);
        expect(importPage.getFormatOptionValue(0)).toEqual('native');
        importPage.clickFormatOption(0);
        common.typeIn(importPage.getImportURLInput(), url);
        importPage.clickStartImportButton();
    };

    it('import a valid iDAI.field JSONL file via HTTP', function() {

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

    it('import a relation and add the corresponding inverse relation', function() {

        importIt('./test/test-data/importer-test-relation-ok.jsonl');
        browser.sleep(2000);
        NavbarPage.clickNavigateToResources();

        resourcesPage.clickSelectResource('obob1');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        documentViewPage.getRelationValue(0).then(function(relationValue) {
            expect(relationValue).toContain('testf1');
        });
        documentViewPage.getRelationName(0).then(function(relationName) {
            expect(relationName).toEqual('Zeitlich vor');
        });

        resourcesPage.clickSelectResource('testf1');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
        documentViewPage.getRelationValue(0).then(function(relationValue) {
            expect(relationValue).toContain('obob1');
        });
        documentViewPage.getRelationName(0).then(function(relationName) {
            expect(relationName).toEqual('Zeitlich nach');
        });
    });

    it('abort if a relation target cannot be found and remove all imported resources & already '
            + 'created inverse relations', function() {

        importIt('./test/test-data/importer-test-relation-error.jsonl');
        NavbarPage.awaitAlert('konnte nicht gefunden werden', false);

        NavbarPage.clickCloseMessage();
        NavbarPage.clickNavigateToResources();

        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob1');
        expect(resourcesPage.getListItemIdentifierText(0)).not.toEqual('obob2');

        resourcesPage.clickSelectResource('testf1');
        documentViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });

});
