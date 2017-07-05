import {browser} from 'protractor';

import {MapPage} from './map.page';
let resourcePage = require('../../resources/resources.page');
let delays = require('../../config/delays');
import {DocumentViewPage} from '../../widgets/document-view.page';
import {DocumentEditWrapperPage} from '../../widgets/document-edit-wrapper.page';


describe('resources/map --', function() {

    function setPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve() }, delays.shortRest)}
            )}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(100,200); })
            .then(() => { return MapPage.clickMap(100,100); });
    }

    function setMultiPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve){
                setTimeout(function() {resolve() }, delays.shortRest)}
            )}).then(() => { return MapPage.clickMap(100, 100); })
            .then(() => { return MapPage.clickMap(200, 200); })
            .then(() => { return MapPage.clickMap(100, 200); })
            .then(() => { return MapPage.clickMap(100, 100); })
            .then(() => { return MapPage.clickMapOption('add-polygon'); })
            .then(() => { return MapPage.clickMap(300, 300); })
            .then(() => { return MapPage.clickMap(500, 400); })
            .then(() => { return MapPage.clickMap(300, 400); })
            .then(() => { return MapPage.clickMap(300, 300); });
    }

    function setPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve() }, delays.shortRest)}
            )}).then(() => { return MapPage.clickMap(100,100); })
            .then(() => { return MapPage.clickMap(200,200); })
            .then(() => { return MapPage.clickMap(300,100); })
            .then(() => { return MapPage.clickMap(400,200); })
            .then(() => { return MapPage.clickMap(400,200); });
    }

    function setMultiPolyline() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve() }, delays.shortRest)}
            )}).then(() => { return MapPage.clickMap(100,100); })
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
        resourcePage.clickCreateObject();
        resourcePage.clickSelectResourceType();
        return resourcePage.clickSelectGeometryType(geometry)
            .then(function() { return mapClickCallback(); });
    }
    
    function createDocWithGeometry(identifier, geometry, mapClickCallback) {
        beginCreateDocWithGeometry(geometry, mapClickCallback).then(
            function() {
                MapPage.clickMapOption('ok');
                DocumentEditWrapperPage.typeInInputField(identifier);
                resourcePage.scrollUp();
                DocumentEditWrapperPage.clickSaveDocument();
            });
    }

    function createDoc(identifier, geometryType, mapClickCallback) {
        if (geometryType) {
            createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else {
            resourcePage.performCreateResource(identifier);
        }
    }
    
    function createDocThenReedit(identifier, geometryType, mapClickCallback) {
        createDoc(identifier, geometryType, mapClickCallback);
        DocumentViewPage.clickReeditGeometry();
    }
    
    beforeEach(function() {
        resourcePage.get();
        browser.sleep(3000);
    });

    it('create a new item with point geometry', function() {
        createDoc('33','point', function() {return MapPage.setMarker(100, 100)});
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Punkt');
        })
    });

    it('create a new item with polyline geometry', function() {
        createDoc('45', 'polyline', setPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polyline');
        })
    });

    it('create a new item with multipolyline geometry', function() {
        createDoc('46', 'polyline', setMultiPolyline);
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Multipolyline');
        })
    });

    it('create a new item with polygon geometry', function() {
        createDoc('34', 'polygon', setPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polygon');
        })
    });

    it('create a new item with multipolygon geometry', function() {
        createDoc('43', 'polygon', setMultiPolygon);
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Multipolygon');
        })
    });

    it('delete a point geometry', function() {
        createDocThenReedit('37', 'point', function() {return MapPage.setMarker(100, 100)});
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Keine');
        })
    });

    it('delete a polyline geometry', function() {
        createDocThenReedit('47', 'polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Keine');
        })
    });

    it('delete a polygon geometry', function() {
        createDocThenReedit('36', 'polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Keine');
        })
    });

    it('delete single polygons of a multipolygon', function() {
        createDocThenReedit('44', 'polygon', setMultiPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polygon');
        })
        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Keine');
        })
    });

    it('delete single polylines of a multipolyline', function() {
        createDocThenReedit('48', 'polyline', setMultiPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polyline');
        })
        DocumentViewPage.clickReeditGeometry();
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Keine');
        })
    });

    it('create a point geometry later', function() {
        resourcePage.performCreateResource('39');
        DocumentViewPage.clickCreateGeometry('point');
        MapPage.setMarker(100, 100);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Punkt');
        })
    });

    it('create a polyline geometry later', function() {
        resourcePage.performCreateResource('49');
        DocumentViewPage.clickCreateGeometry('polyline').then(setPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polyline');
        })
    });

    it('create a multipolyline geometry later', function() {
        resourcePage.performCreateResource('50');
        DocumentViewPage.clickCreateGeometry('polyline').then(setMultiPolyline);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Multipolyline');
        })
    });

    it('create a polygon geometry later', function() {
        resourcePage.performCreateResource('38');
        DocumentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polygon');
        })
    });

    it('create a multipolygon geometry later', function() {
        resourcePage.performCreateResource('42');
        DocumentViewPage.clickCreateGeometry('polygon').then(setMultiPolygon);
        MapPage.clickMapOption('ok');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Multipolygon');
        })
    });

    it('cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', function() {return MapPage.setMarker(100, 100)});
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Punkt');
        })
    });

    it('cancel deleting a polyline geometry', function() {
        createDocThenReedit('51','polyline', setPolyline);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polyline');
        })
    });

    it('cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon);
        MapPage.clickMapOption('delete');
        MapPage.clickMapOption('abort');
        DocumentViewPage.getSelectedGeometryTypeText().then(x=>{
            expect(x).toEqual('Polygon');
        })
    });
    
    it('abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function() {return MapPage.setMarker(100, 100)});
        MapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });
});