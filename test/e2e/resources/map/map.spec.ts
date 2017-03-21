import {browser} from 'protractor';

let mapPage = require('./map.page');
let resourcePage = require('../../resources/resources.page');
let delays = require('../../config/delays');
import {DocumentEditWrapperPage} from '../../widgets/document-edit-wrapper.page';

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
        resourcePage.clickCreateObject();
        resourcePage.clickSelectResourceType();
        return resourcePage.clickSelectGeometryType(geometry)
            .then(function(){return mapClickCallback()});
    }
    
    function createDocWithGeometry(identifier,geometry, mapClickCallback) {
        beginCreateDocWithGeometry(geometry, mapClickCallback).then(
            function(){
                mapPage.clickMapOption('ok');
                DocumentEditWrapperPage.typeInInputField(identifier);
                resourcePage.scrollUp();
                DocumentEditWrapperPage.clickSaveDocument();
            });
    }
    
    
    function createDoc(identifier,geometryType, mapClickCallback) {
        if (geometryType) {
            createDocWithGeometry(identifier, geometryType, mapClickCallback)
        } else {
            resourcePage.performCreateResource(identifier);
        }
    }
    
    function createDocThenReedit(identifier,geometryType, mapClickCallback) {
        createDoc(identifier, geometryType, mapClickCallback);
        DocumentEditWrapperPage.clickBackToDocumentView();
        resourcePage.clickReeditGeometry();
    }
    
    beforeEach(function(){
        resourcePage.get();
    });

    it('should create a new item with point geometry ', function() {
        createDoc('33','point', function(){return mapPage.setMarker(100, 100)});
        DocumentEditWrapperPage.clickBackToDocumentView();
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('should create a new item with polygon geometry ', function() {
        createDoc('34', 'polygon', setPolygon);
        DocumentEditWrapperPage.clickBackToDocumentView();
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });

    it('should delete a point geometry ', function() {
        createDocThenReedit('37', 'point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Keine');
    });

    it('should delete a polygon geometry ', function() {
        createDocThenReedit('36' ,'polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('ok');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Keine');
    });

    it('should create a point geometry later', function() {
        resourcePage.performCreateResource('39');
        DocumentEditWrapperPage.clickBackToDocumentView();
        resourcePage.clickCreateGeometry('point');
        mapPage.setMarker(100, 100);
        mapPage.clickMapOption('ok');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('should create a polygon geometry later', function() {
        resourcePage.performCreateResource('38');
        DocumentEditWrapperPage.clickBackToDocumentView();
        resourcePage.clickCreateGeometry('polygon').then(setPolygon);
        mapPage.clickMapOption('ok');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });


    it('should cancel deleting a point geometry', function() {
        createDocThenReedit('40','point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Punkt');
    });

    it('should cancel deleting a polygon geometry', function() {
        createDocThenReedit('41','polygon', setPolygon);
        mapPage.clickMapOption('delete');
        mapPage.clickMapOption('abort');
        expect(resourcePage.getSelectedGeometryTypeText()).toEqual('Polygon');
    });
    
    
    it('should abort item creation completely when aborting geometry editing', function() {
        beginCreateDocWithGeometry('point', function(){return mapPage.setMarker(100, 100)});
        mapPage.clickMapOption('abort');
        expect(browser.getCurrentUrl()).toContain('resources');
        expect(browser.getCurrentUrl()).not.toContain('edit');
    });
});