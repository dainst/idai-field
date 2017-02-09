var common = require("../common.js");
var importPage = require('./import.page');

var EC = protractor.ExpectedConditions;

describe('import', function() {

    beforeEach(function(done) {
        importPage.get().then(function(){
            done();
        })
    });

    it('should import a valid iDAI.field JSONL file via HTTP', function(done) {
        var url = "./test/test-data/importer-test-ok.jsonl";

        importPage.clickImportButton()
            .then(function() {
                expect(importPage.getSourceOptionValue(1)).toEqual("http");
                return importPage.clickSourceOption(1);
            })
            .then(function() {
                expect(importPage.getFormatOptionValue(0)).toEqual("native");
                return importPage.clickFormatOption(0);
            })
            .then(function(){return common.typeIn(importPage.getImportURLInput(), url)})
            .then(importPage.clickStartImportButton)
            .then(function() {
                browser.wait(EC.presenceOf(importPage.getMessageElement(1)), 5000).then(function(){
                    expect(importPage.getMessage(0).getText()).toContain("Starte Import");
                    expect(importPage.getMessage(1).getText()).toContain("4 Ressourcen wurden erfolgreich importiert.");
                    done();
                });
            });
    });
});
