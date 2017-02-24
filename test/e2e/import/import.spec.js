var common = require("../common.js");
var importPage = require('./import.page');

var EC = protractor.ExpectedConditions;

describe('import', function() {

    beforeEach(function() {
        importPage.get();
    });

    it('should import a valid iDAI.field JSONL file via HTTP', function() {
        var url = "./test/test-data/importer-test-ok.jsonl";

        importPage.clickImportButton();
        expect(importPage.getSourceOptionValue(1)).toEqual("http");
        importPage.clickSourceOption(1);
        expect(importPage.getFormatOptionValue(0)).toEqual("native");
        importPage.clickFormatOption(0);
        common.typeIn(importPage.getImportURLInput(), url);
        importPage.clickStartImportButton();
        browser.wait(EC.presenceOf(importPage.getMessageElement(1)), 5000);
        expect(importPage.getMessageText(0).getText()).toContain("Starte Import");
        expect(importPage.getMessageText(1).getText()).toContain("4 Ressourcen wurden erfolgreich importiert.");
    });
});
