var common = require("../common.js");
var utils = require("../utils.js");

describe('import', function() {

    function getSourceOptions() {
        return element(by.id('importSourceSelect')).all(by.css('select option'));
    }

    function getFormatOptions() {
        return element(by.id('importFormatSelect')).all(by.css('select option'));
    }

    beforeEach(function() {
        browser.get('/#/resources/');
    });

    it('should import a valid iDAI.field JSONL file via HTTP', function() {
        var url = "./test/test-data/importer-test-ok.jsonl";

        element(by.id('importButton')).click()
            .then(getSourceOptions)
            .then(function(options) {
                expect(options[1].getAttribute("value")).toEqual("http");
                options[1].click();
            })
            .then(getFormatOptions)
            .then(function(options) {
                expect(options[0].getAttribute("value")).toEqual("native");
                options[0].click();
            })
            .then(common.typeIn(element(by.id('importUrlInput')), url))
            .then(element(by.id('importStartButton')).click())
            .then(function() {
                browser.wait(protractor.ExpectedConditions.presenceOf(element(by.id('message-1'))), 5000);
                expect(element(by.id('message-0')).getText()).toContain("Starte Import");
                expect(element(by.id('message-1')).getText()).toContain("4 Ressourcen wurden erfolgreich importiert.");
            });
    });

});
