var common = require("./common.js");

describe('idai field app', function() {

    function typeInIdentifierInSearchField() {
        return common.typeIn(element(by.id('object-search')), "12");
    }

    beforeEach(function(){
        browser.get('/');
    });

    it('should create a new object of first listed type ', function() {
        common.createObject("12")
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });

    it('should warn if an existing id is used ', function() {
        common.createObject("12")
            .then(common.createObject("12"))
            .then(function(){
                expect(element(by.id('message-0')).getText()).
                    toEqual("Objekt-Identifier existiert bereits.");
            });
    });

    it('should find it by its identifier', function() {
        common.createObject("12")
            .then(typeInIdentifierInSearchField)
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });
});