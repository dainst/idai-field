import {browser,protractor} from 'protractor';

var common = require("../common.js");
var importPage = require('./import.page');
var resourcesPage = require('../resources/resources.page');
var navbarPage = require('../navbar.page');
var delays = require('../config/delays');

var EC = protractor.ExpectedConditions;

xdescribe('import tests', function() {

    beforeEach(function() {
        importPage.get();
    });

    var importIt = function(url) {
        importPage.clickImportButton();
        expect(importPage.getSourceOptionValue(1)).toEqual("http");
        importPage.clickSourceOption(1);
        expect(importPage.getFormatOptionValue(0)).toEqual("native");
        importPage.clickFormatOption(0);
        common.typeIn(importPage.getImportURLInput(), url);
        importPage.clickStartImportButton();
        browser.wait(EC.presenceOf(importPage.getMessageElement(1)), 5000);
        expect(importPage.getMessageText(0).getText()).toContain("Starte Import");
    };

    it('importer should import a valid iDAI.field JSONL file via HTTP', function() {
        importIt("./test/test-data/importer-test-ok.jsonl");
        expect(importPage.getMessageText(1).getText()).toContain("4 Ressourcen wurden erfolgreich importiert.");
        navbarPage.clickNavigateToResources();
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob4')), delays.ECWaitTime);
    });

    it('importer should import until a missing field definition is found', function() {
        importIt("./test/test-data/importer-test-missing-field-definition.jsonl");
        expect(importPage.getMessageText(1).getText()).toContain('Fehlende Felddefinition für das Feld "a" der Ressource vom Typ "jedi".');
        navbarPage.clickNavigateToResources();
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
    });

    it('importer should import until a missing field definition is found', function() {
        importIt("./test/test-data/importer-test-invalid_json.jsonl");
        expect(importPage.getMessageText(1).getText()).toContain('Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile 3 ist nicht valide.');
        navbarPage.clickNavigateToResources();
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
    });

    it('importer should import until a constraint violation is detected', function() {
        importIt("./test/test-data/importer-test-constraint-violation.jsonl");
        expect(importPage.getMessageText(1).getText()).toContain('Beim Import ist ein Fehler aufgetreten: Ressourcen-Identifier obob2 existiert bereits.');
        navbarPage.clickNavigateToResources();
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemEl('obob2')), delays.ECWaitTime);
    });
});
