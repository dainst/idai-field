var mapPage = require('./map.page');
var resourcePage = require('../resources/resources.page');

describe('idai field app', function() {

    var mapEl;
    
    function clickMap(toRight, toBottom) {
        browser.actions()
            .mouseMove(mapEl, {x: toRight, y: toBottom})
            .click()
            .perform();
    }

    function setPolygon() {
        clickMap(100,100);
        clickMap(200,200);
        clickMap(100,200);
        clickMap(100,100);
    }

    function beginCreateDocWithGeometry(geometry, mapClickCallback) {
        return resourcePage.clickCreateObject()
            .then(resourcePage.selectResourceType)
            .then(resourcePage.selectGeometryType(geometry))
            .then(mapClickCallback);
    }
    
    function createDocWithGeometry(identifier,geometry, mapClickCallback) {
        return beginCreateDocWithGeometry(geometry, mapClickCallback)
            .then(mapPage.clickMapOption('ok'))
            .then(resourcePage.typeInIdentifier(identifier))
            .then(resourcePage.scrollUp)
            .then(resourcePage.clickSaveDocument);
    }
    
    
    function createDoc(identifier,geometryType, mapClickCallback) {
        if (geometryType == 'point') {
            return createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else if (geometryType == 'polygon') {
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
    
    beforeEach(function(){
        resourcePage.get();
        mapEl = element(by.id("map-container"));
    });

    it('should create a new item with point geometry ', function() {
        createDoc('33','point', mapPage.setMarker(100, 100))
            .then(function () {
                expect(resourcePage.getFirstListItemIdentifier()).toEqual('33');
                expect(resourcePage.getMessage()).toContain('erfolgreich');
                return resourcePage.clickBackToDocumentView();
            })
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            });
    });

    it('should create a new item with polygon geometry ', function() {
        createDoc('34', 'polygon', setPolygon)
            .then(function () {
                expect(resourcePage.getFirstListItemIdentifier()).toEqual('34');
                expect(resourcePage.getMessage()).toContain('erfolgreich');
                return resourcePage.clickBackToDocumentView();
            })
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            });
    });

    it('should delete a point geometry ', function() {
        createDocThenReedit('37', 'point', mapPage.setMarker(100, 100))
            .then(mapPage.clickMapOption('delete'))
            .then(mapPage.clickMapOption('ok'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
            })
    });

    it('should delete a polygon geometry ', function() {
        createDocThenReedit('36' ,'polygon', setPolygon)
            .then(mapPage.clickMapOption('delete'))
            .then(mapPage.clickMapOption('ok'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
            })
    });

    it('should create a point geometry later', function() {
        resourcePage.createResource('39')
            .then(resourcePage.clickBackToDocumentView)
            .then(resourcePage.clickCreateGeometry('point'))
            .then(mapPage.setMarker(100, 100))
            .then(mapPage.clickMapOption('ok'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            })
    });

    it('should create a polygon geometry later', function() {
        resourcePage.createResource('38')
            .then(resourcePage.clickBackToDocumentView)
            .then(resourcePage.clickCreateGeometry('polygon'))
            .then(setPolygon)
            .then(mapPage.clickMapOption('ok'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            })
    });


    it('should cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', mapPage.setMarker(100, 100))
            .then(mapPage.clickMapOption('delete'))
            .then(mapPage.clickMapOption('abort'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            })
    });

    it('should cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon)
            .then(mapPage.clickMapOption('delete'))
            .then(mapPage.clickMapOption('abort'))
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            })
    });
    
    
    it('should abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', mapPage.setMarker(100, 100))
            .then(mapPage.clickMapOption('abort'))
            .then(function() {
                expect(browser.getCurrentUrl()).toContain('resources');
                expect(browser.getCurrentUrl()).not.toContain('edit');
            });
    });
});