var common = require("../common.js");

describe('idai field app', function() {

    beforeEach(function(){
        browser.get('/#/resources');
    });

    it('should create a new object of first listed type ', function() {
        common.createObject("12")
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
                expect(element(by.id('message-0')).getText())
                    .toContain("erfolgreich");
            });
    });
    
    it('should warn if identifier is missing', function () {
        common.createObject("")
            .then(function(){
                expect(element(by.id('message-0')).getText())
                    .toContain("fehlt");
            });
    });

    it('should warn if an existing id is used', function() {
        common.createObject("12")
            .then(common.createObject("12"))
            .then(function(){
                expect(element(by.id('message-0')).getText())
                    .toContain("existiert bereits");
            });
    });
});