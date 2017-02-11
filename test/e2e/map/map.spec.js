var mapPage = require('./map.page');
var resourcePage = require('../resources/resources.page');
var delays = require('../config/delays');

describe('resources/map', function() {

    function setPolygon() {
        return Promise.resolve()
            .then(function(){return new Promise(function(resolve){setTimeout(function(){resolve()},delays.shortRest)})})
            .then(function(){return mapPage.clickMap(100,100)})
            .then(function(){return mapPage.clickMap(200,200)})
            .then(function(){return mapPage.clickMap(100,200)})
            .then(function(){return mapPage.clickMap(100,100)});
    }

    function beginCreateDocWithGeometry(geometry, mapClickCallback) {
        return resourcePage.clickCreateObject()
            .then(resourcePage.selectResourceType)
            .then(function(){return resourcePage.selectGeometryType(geometry)})
            .then(mapClickCallback);
    }
    
    function createDocWithGeometry(identifier,geometry, mapClickCallback) {
        return beginCreateDocWithGeometry(geometry, mapClickCallback)
            .then(function(){return mapPage.clickMapOption('ok')})
            .then(function(){return resourcePage.typeInIdentifier(identifier)})
            .then(resourcePage.scrollUp)
            .then(resourcePage.clickSaveDocument);
    }
    
    
    function createDoc(identifier,geometryType, mapClickCallback) {
        if (geometryType) {
            return createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else {
            return resourcePage.createResource(identifier);
        }
    }
    
    function createDocThenReedit(identifier,geometryType, mapClickCallback) {
        return createDoc(identifier, geometryType, mapClickCallback)
            .then(resourcePage.clickBackToDocumentView)
            .then(resourcePage.clickReeditGeometry);
    }
    
    beforeEach(function(done){
        resourcePage.get().then(function(){
           done();
        });
    });

    it('should create a new item with point geometry ', function() {
        createDoc('33','point', function(){return mapPage.setMarker(100, 100)});
        resourcePage.clickBackToDocumentView();
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
    });

    it('should create a new item with polygon geometry ', function() {
        createDoc('34', 'polygon', setPolygon);
        resourcePage.clickBackToDocumentView();
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
    });

    it('should delete a point geometry ', function() {
        createDocThenReedit('37', 'point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
    });

    it('should delete a polygon geometry ', function() {
        createDocThenReedit('36' ,'polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
    });

    it('should create a point geometry later', function() {
        resourcePage.createResource('39');
        resourcePage.clickBackToDocumentView();
        resourcePage.clickCreateGeometry('point');
        mapPage.setMarker(100, 100);
        mapPage.clickMapOption('ok');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
    });

    it('should create a polygon geometry later', function() {
        resourcePage.createResource('38');
        resourcePage.clickBackToDocumentView();
        resourcePage.clickCreateGeometry('polygon').then(setPolygon);
        mapPage.clickMapOption('ok');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
    });


    it('should cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
    });

    it('should cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
    });
    
    
    it('should abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });
});