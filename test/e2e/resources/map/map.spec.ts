import {browser} from 'protractor';
import {MapPage} from './map.page';
import {ResourcesPage} from '../resources.page';
import {DocumentViewPage} from '../../widgets/document-view.page';
import {DocumentEditWrapperPage} from '../../widgets/document-edit-wrapper.page';

let delays = require('../../config/delays');


describe('resources/map --', function() {

    function setPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest);
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(100,200); })
            .then(() => { return MapPage.clickMap(100,100); });
    }

    function setMultiPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, 2000);
            })}).then(() => { return MapPage.clickMap(100, 100); })
            .then(() => { return MapPage.clickMap(200, 200); })
            .then(() => { return MapPage.clickMap(100, 200); })
            .then(() => { return MapPage.clickMap(100, 100); })
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, 2000)
            })}).then(() => { return MapPage.clickMapOption('add-polygon'); })
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, 2000)
            })}).then(() => { return MapPage.clickMap(300, 300); })
            .then(() => { return MapPage.clickMap(500, 400); })
            .then(() => { return MapPage.clickMap(300, 400); })
            .then(() => { return MapPage.clickMap(300, 300); })
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, 2000)
            })});
    }

    function setPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest);
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMap(400,200); });
    }

    function setMultiPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve(); }, delays.shortRest)
            })}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMapOption('add-polyline'); })
            .then(() => { return MapPage.clickMap(500,200); })
            .then(() => { return MapPage.clickMap(500,100); })
            .then(() => { return MapPage.clickMap(400,300); })
            .then(() => { return MapPage.clickMap(400,400); })
            .then(() => { return MapPage.clickMap(400,400); });
    }

    function beginCreateDocWithGeometry(geometry, mapClickCallback) {
        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        return ResourcesPage.clickSelectGeometryType(geometry)
            .then(function() { return mapClickCallback(); });
    }
    
    function createDocWithGeometry(identifier, geometry, mapClickCallback) {
        beginCreateDocWithGeometry(geometry, mapClickCallback).then(
            function() {
                MapPage.clickMapOption('ok');
                DocumentEditWrapperPage.typeInInputField(identifier);
                ResourcesPage.scrollUp();
                DocumentEditWrapperPage.clickSaveDocument();
            });
    }

    function createDoc(identifier, geometryType, mapClickCallback) {
        if (geometryType) {
            createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else {
            ResourcesPage.performCreateResource(identifier);
        }
    }
    
    function createDocThenReedit(identifier, geometryType, mapClickCallback) {
        createDoc(identifier, geometryType, mapClickCallback);
        DocumentViewPage.clickReeditGeometry();
    }
    
    beforeEach(function() {
        ResourcesPage.get();
        browser.sleep(3000);
    });

    it('create a new item with point geometry', function() {
        createDoc('doc','point', function() { return MapPage.setMarker(100, 100); });
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });

    it('create a new item with polyline geometry', function() {
        createDoc('doc', 'polyline', setPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });

    it('create a new item with multipolyline geometry', function() {
        createDoc('doc', 'polyline', setMultiPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolyline');
        });
    });

    it('create a new item with polygon geometry', function() {
        createDoc('doc', 'polygon', setPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });

    it('create a new item with multipolygon geometry', function() {
        createDoc('doc', 'polygon', setMultiPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolygon');
        });
    });

    it('delete a point geometry', function() {
        createDocThenReedit('doc', 'point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('delete a polyline geometry', function() {
        createDocThenReedit('doc', 'polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('delete a polygon geometry', function() {
        createDocThenReedit('doc', 'polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('delete single polygons of a multipolygon', function() {
        createDocThenReedit('doc', 'polygon', setMultiPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });

        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        })
    });

    it('delete single polylines of a multipolyline', function() {
        createDocThenReedit('doc', 'polyline', setMultiPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });

        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('create a point geometry later', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });

    it('create a polyline geometry later', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });

    it('create a multipolyline geometry later', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setMultiPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolyline');
        });
    });

    it('create a polygon geometry later', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });

    it('create a multipolygon geometry later', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setMultiPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Multipolygon');
        });
    });

    it('cancel creating a point geometry', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('cancel creating a polyline geometry', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polyline').then(setPolyline);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('cancel creating a polygon geometry', function() {
        ResourcesPage.performCreateResource('doc');
        DocumentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Keine');
        });
    });

    it('cancel deleting a point geometry', function() {
        createDocThenReedit('doc', 'point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Punkt');
        });
    });

    it('cancel deleting a polyline geometry', function() {
        createDocThenReedit('doc', 'polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polyline');
        });
    });

    it('cancel deleting a polygon geometry', function() {
        createDocThenReedit('doc', 'polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(text => {
            expect(text).toEqual('Polygon');
        });
    });
    
    it('abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function() { return MapPage.setMarker(100, 100); });
        MapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });
});