var common = require("../common.js");
var utils = require("../utils.js");

describe('idai field app', function() {

    beforeEach(function(){
        browser.get('/#/resources');
    });

    it('should create a new object of first listed type ', function() {
        common.createObject('12')
            .then(common.expectMsg('erfolgreich'));
    });

    it('should show the success msg also on route change', function() {
        common.createObject('12')
            .then(common.removeMessage)
            .then(common.typeInIdentifier('34'))
            .then(common.selectObject(0))
            .then(common.clickSaveInModal)
            .then(common.expectMsg('erfolgreich'));
    });
    
    it('should warn if identifier is missing', function () {
        common.createObject('')
            .then(common.expectMsg('fehlt'));
    });

    it('should warn if an existing id is used', function() {
        common.createObject('12')
            .then(common.createObject('12'))
            .then(common.expectMsg("existiert bereits"));
    });
});