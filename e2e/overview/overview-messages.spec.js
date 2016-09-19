var common = require("../common.js");
var utils = require("../utils.js");

/*
 * In order to prevent errors caused by e2e tests running too fast you can slow them down by calling the following
 * function. Use higher values for slower tests.
 *
 * utils.delayPromises(50);
 *
 */
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

    it('should show the success msg also on route change', function() {
        common.createObject("12")
            .then(common.removeMessage)
            .then(common.typeInIdentifier("34"))
            .then(common.selectObject(0))
            .then(common.clickSaveInModal)
            .then(function(){
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