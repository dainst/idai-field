import {browser} from 'protractor';

let mapPage = require('./map.page');
let resourcePage = require('../../resources/resources.page');
let delays = require('../../config/delays');
let documentViewPage = require('../../widgets/document-view.page');
import {DocumentEditWrapperPage} from '../../widgets/document-edit-wrapper.page';

describe('resources/map', function() {

    function setPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve) {
                setTimeout(function() { resolve() }, delays.shortRest)}
            )}).then(() => { return mapPage.clickMap(100,100); })
            .then(() => { return mapPage.clickMap(200,200); })
            .then(() => { return mapPage.clickMap(100,200); })
            .then(() => { return mapPage.clickMap(100,100); });
    }

    function setMultiPolygon() {
        return Promise.resolve()
            .then(() => { return new Promise(function(resolve){
                setTimeout(function() {resolve() }, delays.shortRest)}
            )}).then(() => { return mapPage.clickMap(100, 100); })
            .then(() => { return mapPage.clickMap(200, 200); })
            .then(() => { return mapPage.clickMap(100, 200); })
            .then(() => { return mapPage.clickMap(100, 100); })
            .then(() => { return mapPage.clickMapOption('add-polygon'); })
            .then(() => { return mapPage.clickMap(300, 300); })
            .then(() => { return mapPage.clickMap(500, 400); })
            .then(() => { return mapPage.clickMap(300, 400); })
            .then(() => { return mapPage.clickMap(300, 300); });
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
                mapPage.clickMapOption('ok');
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
        DocumentEditWrapperPage.clickBackToDocumentView();
        documentViewPage.clickReeditGeometry();
    }
    
    beforeEach(function() {
        resourcePage.get();
        browser.sleep(3000);
    });

    it('create a new item with point geometry ', function() {
        createDoc('33','point', function(){return mapPage.setMarker(100, 100)});
        DocumentEditWrapperPage.clickBackToDocumentView();
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('create a new item with polygon geometry ', function() {
        createDoc('34', 'polygon', setPolygon);
        DocumentEditWrapperPage.clickBackToDocumentView();
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });

    it('create a new item with multipolygon geometry ', function() {
        createDoc('43', 'polygon', setMultiPolygon);
        DocumentEditWrapperPage.clickBackToDocumentView();
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Multipolygon');
    });

    it('delete a point geometry ', function() {
        createDocThenReedit('37', 'point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Keine');
    });

    it('delete a polygon geometry ', function() {
        createDocThenReedit('36' ,'polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Keine');
    });

    it('delete single polygons of a multipolygon', function() {
        createDocThenReedit('44' ,'polygon', setMultiPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Polygon');
        documentViewPage.clickReeditGeometry();
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Keine');
    });

    it('create a point geometry later', function() {
        resourcePage.performCreateResource('39');
        DocumentEditWrapperPage.clickBackToDocumentView();
        documentViewPage.clickCreateGeometry('point');
        mapPage.setMarker(100, 100);
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('create a polygon geometry later', function() {
        resourcePage.performCreateResource('38');
        DocumentEditWrapperPage.clickBackToDocumentView();
        documentViewPage.clickCreateGeometry('polygon').then(setPolygon);
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });

    it('create a multipolygon geometry later', function() {
        resourcePage.performCreateResource('42');
        DocumentEditWrapperPage.clickBackToDocumentView();
        documentViewPage.clickCreateGeometry('polygon').then(setMultiPolygon);
        mapPage.clickMapOption('ok');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Multipolygon');
    });

    it('cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(documentViewPage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });
    
    it('abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });
});