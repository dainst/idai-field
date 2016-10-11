var common = require("../common.js");
var utils = require("../utils.js");

describe('idai field app', function() {

    var mapEl;
    
    function clickMap(map,toRight, toBottom) {
        browser.actions()
            .mouseMove(map, {x: toRight, y: toBottom})
            .click()
            .perform();
    }
    
    function setMarker() {
        clickMap(mapEl,100,100);
    }

    function setPolygon() {
        clickMap(mapEl,100,100);
        clickMap(mapEl,200,200);
        clickMap(mapEl,100,200);
        clickMap(mapEl,100,100);
    }
    

    function mapClickOk() {
        return element(by.id('map-editor-button-ok')).click();
    }
    
    function createObjectWithGeometry(identifier,geometry,geofun) {
        return common.clickCreateObjectButton()
            .then(common.selectObjectType)
            .then(common.chooseGeometry(geometry))
            .then(geofun)
            .then(mapClickOk)
            .then(common.typeInIdentifier(identifier))
            .then(common.scrollUp)
            .then(common.saveObject);
    }
    
    beforeEach(function(){
        browser.get('/#/resources');
        mapEl = element(by.id("map-container"));
    });

    it('should create a new item with point geometry ', function() {
        createObjectWithGeometry('33','point',setMarker)
            .then(common.expectObjectCreatedSuccessfully('33'));
    });

    it('should create a new item with polygon geometry ', function() {
        createObjectWithGeometry('34','polygon',setPolygon)
            .then(common.expectObjectCreatedSuccessfully('34'));
    });
});