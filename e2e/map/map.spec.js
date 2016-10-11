var common = require("../common.js");
var utils = require("../utils.js");

describe('idai field app', function() {

    
    var clickMap = function (map,toRight, toBottom) {
        browser.actions()
            .mouseMove(map, {x: toRight, y: toBottom})
            .click()
            .perform();
    };
    
    function setMarker() {
        clickMap(element(by.id("map-container")),100,100);
    }
    
    function choosePointGeometry() {
        return element(by.id('choose-geometry-option-point')).click();
    }

    function mapClickOk() {
        return element(by.id('map-editor-button-ok')).click();
    }
    
    function createObjectWithPointGeometry(identifier) {
        return common.clickCreateObjectButton()
            .then(common.selectObjectType)
            .then(choosePointGeometry)
            .then(setMarker)
            .then(mapClickOk)
            .then(common.typeInIdentifier(identifier))
            .then(common.scrollUp)
            .then(common.saveObject);
    }

    beforeEach(function(){
        browser.get('/#/resources');
    });

    it('should create a new item with point geometry ', function() {
        createObjectWithPointGeometry("12")
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
                expect(element(by.id('message-0')).getText())
                    .toContain("erfolgreich");
            });
    });
});