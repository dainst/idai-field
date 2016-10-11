var common = require("../common.js");
var utils = require("../utils.js");

describe('idai field app', function() {

    var mapEl;
    
    function clickMap(toRight, toBottom) {
        browser.actions()
            .mouseMove(mapEl, {x: toRight, y: toBottom})
            .click()
            .perform();
    }

    function setMarker() {
        clickMap(100,100);
    }

    function setPolygon() {
        clickMap(100,100);
        clickMap(200,200);
        clickMap(100,200);
        clickMap(100,100);
    }
    

    function mapOption(what) {
        return element(by.id('map-editor-button-'+what)).click();
    }
    
    function clickReeditGeometry() {
        return element(by.id('document-view-button-edit-geometry')).click();
    }

    function clickCreateGeometry(geometry) {
        return element(by.id('document-view-button-create-'+geometry)).click();
    }


    function createDocWithGeometry(identifier,geometry,geofun) {
        return common.clickCreateObjectButton()
            .then(common.selectType)
            .then(common.chooseGeometry(geometry))
            .then(geofun)
            .then(mapOption('ok'))
            .then(common.typeInIdentifier(identifier))
            .then(common.scrollUp)
            .then(common.saveObject);
    }
    
    
    function createDoc(identifier,geometryType) {
        if (geometryType == 'point') {
            return createDocWithGeometry(identifier,geometryType,setMarker())
        } else if (geometryType == 'polygon') {
            return createDocWithGeometry(identifier,geometryType,setPolygon)
        } else {
            return common.createDoc(identifier);
        }
    }
    
    function createDocThenReedit(identifier,geometryType) {
        return createDoc(identifier,geometryType)
            .then(common.gotoView)
            .then(clickReeditGeometry);
    }
    
    
    function expectGeometry(geometry) {
        expect(element.all(by.css('#document-view-field-geometry span')).get(0).getText()).toEqual(geometry);
    }
    
    beforeEach(function(){
        browser.get('/#/resources');
        mapEl = element(by.id("map-container"));
    });

    it('should create a new item with point geometry ', function() {
        createDoc('33','point')
            .then(common.expectObjectCreatedSuccessfully('33'));
    });

    it('should create a new item with polygon geometry ', function() {
        createDoc('34','polygon')
            .then(common.expectObjectCreatedSuccessfully('34'));
    });
    
    it('should delete a polygon geometry ', function() {
        createDocThenReedit('36','polygon')
            .then(mapOption('delete'))
            .then(mapOption('ok'))
            .then(expectGeometry('Keine'))
    });

    it('should delete a point geometry ', function() {
        createDocThenReedit('37','point')
            .then(mapOption('delete'))
            .then(mapOption('ok'))
            .then(expectGeometry('Keine'))
    });
    
    it('should create a polygon geometry later', function() {
        common.createDoc('38')
            .then(common.gotoView)
            .then(clickCreateGeometry('polygon'))
            .then(setPolygon)
            .then(mapOption('ok'))
            .then(expectGeometry('Polygon'))
    });

    it('should create a point geometry later', function() {
        common.createDoc('39')
            .then(common.gotoView)
            .then(clickCreateGeometry('point'))
            .then(setMarker)
            .then(mapOption('ok'))
            .then(expectGeometry('Punkt'))
    });


    it('should cancel deleting a point geometry', function() {
        createDocThenReedit('40','point')
            .then(mapOption('delete'))
            .then(mapOption('abort'))
            .then(expectGeometry('Punkt'))
    });

    it('should cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon')
            .then(mapOption('delete'))
            .then(mapOption('abort'))
            .then(expectGeometry('Polygon'))
    });
    
});