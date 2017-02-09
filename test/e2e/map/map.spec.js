var mapPage = require('./map.page');
var resourcePage = require('../resources/resources.page');


describe('idai field app', function() {

    function setPolygon() {
        return mapPage.clickMap(100,100)
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
    
    beforeEach(function(done){
        resourcePage.get().then(function(){
           done();
        });
    });

    it('should create a new item with point geometry ', function() {
        createDoc('33','point', function(){return mapPage.setMarker(100, 100)})
            .then(function () {
                return resourcePage.clickBackToDocumentView();
            })
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            });
    });

    it('should create a new item with polygon geometry ', function() {
        createDoc('34', 'polygon', setPolygon)
            .then(function () {
                return resourcePage.clickBackToDocumentView();
            })
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            });
    });

    it('should delete a point geometry ', function() {
        createDocThenReedit('37', 'point', function(){mapPage.setMarker(100, 100)})
            .then(function(){return mapPage.clickMapOption('delete')})
            .then(function(){return mapPage.clickMapOption('ok')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
            })
    });

    it('should delete a polygon geometry ', function() {
        createDocThenReedit('36' ,'polygon', setPolygon)
            .then(function(){return mapPage.clickMapOption('delete')})
            .then(function(){return mapPage.clickMapOption('ok')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Keine');
            })
    });

    it('should create a point geometry later', function() {
        resourcePage.createResource('39')
            .then(resourcePage.clickBackToDocumentView)
            .then(function(){return resourcePage.clickCreateGeometry('point')})
            .then(function(){return mapPage.setMarker(100, 100)})
            .then(function(){return mapPage.clickMapOption('ok')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            })
    });

    it('should create a polygon geometry later', function() {
        resourcePage.createResource('38')
            .then(resourcePage.clickBackToDocumentView)
            .then(function(){return resourcePage.clickCreateGeometry('polygon')})
            .then(setPolygon)
            .then(function(){return mapPage.clickMapOption('ok')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            })
    });


    it('should cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', function(){return mapPage.setMarker(100, 100)})
            .then(function(){return mapPage.clickMapOption('delete')})
            .then(function(){return mapPage.clickMapOption('abort')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Punkt');
            })
    });

    it('should cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon)
            .then(function(){return mapPage.clickMapOption('delete')})
            .then(function(){return mapPage.clickMapOption('abort')})
            .then(function() {
                expect(resourcePage.getTypeOfSelectedGeometry()).toEqual('Polygon');
            })
    });
    
    
    it('should abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function(){return mapPage.setMarker(100, 100)})
            .then(function(){return mapPage.clickMapOption('abort')})
            .then(function() {
                expect(browser.getCurrentUrl()).toContain('resources');
                expect(browser.getCurrentUrl()).not.toContain('edit');
            });
    });
});