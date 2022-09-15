import { start, stop, waitForExist, resetApp, navigateTo, waitForNotExist, getUrl, pause, getText, click } from '../app';
import { MapPage } from './map.page';
import { ResourcesPage } from '../resources/resources.page';
import { DoceditPage } from '../docedit/docedit.page';
import { NavbarPage } from '../navbar.page';
import { GeometryViewPage } from '../widgets/geometry-view.page';
import { ImagePickerModalPage } from '../widgets/image-picker-modal.page';


describe('map --', function() {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');

        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    async function setPolygon() {

        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(200, 200);
        await MapPage.clickMap(100, 200);
        return MapPage.clickMap(100, 100);
    }


    async function setMultiPolygon() {

        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(200, 200);
        await MapPage.clickMap(100, 200);
        await MapPage.clickMap(100, 175);
        await MapPage.clickMap(100, 150);
        await MapPage.clickMap(100, 100);

        await MapPage.clickMapOption('add-polygon');

        await MapPage.clickMap(300, 300);
        await MapPage.clickMap(250, 200);
        await MapPage.clickMap(300, 200);
        await MapPage.clickMap(300, 250);
        await MapPage.clickMap(300, 275);
        return MapPage.clickMap(300, 300);
    }


    async function setPolyline() {

        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(200, 200);
        await MapPage.clickMap(300, 100);
        await MapPage.clickMap(400, 200);
        return MapPage.clickMap(400, 200);
    }


    async function setUnfinishedPolyline() {

        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(200, 200);
        await MapPage.clickMap(300, 100);
        return MapPage.clickMap(400, 200);
    }


    async function setMultiPolyline() {

        await MapPage.clickMap(50, 50);
        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(150, 50);
        await MapPage.clickMap(200, 100);
        await MapPage.clickMap(200, 100);

        await MapPage.clickMapOption('add-polyline');

        await MapPage.clickMap(150, 100);
        await MapPage.clickMap(150, 75);
        await MapPage.clickMap(200, 150);
        await MapPage.clickMap(200, 50);
        return MapPage.clickMap(200, 50);
    }


    async function setUnfinishedMultiPolyline() {

        await MapPage.clickMap(50, 50);
        await MapPage.clickMap(100, 100);
        await MapPage.clickMap(150, 50);
        await MapPage.clickMap(200, 100);

        await MapPage.clickMapOption('add-polyline');

        await MapPage.clickMap(150, 100);
        await MapPage.clickMap(150, 75);
        await MapPage.clickMap(200, 150);
        await MapPage.clickMap(200, 50);
    }


    function setPoint() {

        return MapPage.setMarker(100, 100);
    }


    async function setMultiPoint() {

        await MapPage.clickMap(100, 100);
        await MapPage.clickMapOption('add-point');
        return MapPage.clickMap(200, 200);
    }


    async function beginCreateDocWithGeometry(geometry) {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType(geometry);
        return pause(500);
    }


    async function createDocWithGeometry(identifier, geometry, createGeometryFunction) {

        await beginCreateDocWithGeometry(geometry);
        await createGeometryFunction();
        await MapPage.clickMapOption('ok');
        await DoceditPage.typeInInputField('identifier', identifier);
        //ResourcesPage.scrollUp();
        return DoceditPage.clickSaveDocument();
    }


    async function createDoc(identifier, geometryType, createGeometryFunction) {

        return geometryType
            ? createDocWithGeometry(identifier, geometryType, createGeometryFunction)
            : ResourcesPage.performCreateResource(identifier);
    }


    async function createDocThenReedit(identifier, geometryType, createGeometryFunction) {

        await createDoc(identifier, geometryType, createGeometryFunction);
        return GeometryViewPage.performReeditGeometry(identifier);
    }


    it('create a new item with point geometry', async done => {

        await createDoc('doc', 'point', setPoint);

        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Punkt');

        done();
    });


    it('create a new item with multipoint geometry', async done => {

        await createDoc('doc', 'point', setMultiPoint);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipunkt');

        done();
    });


    it('create a new item with polyline geometry', async done => {

        await createDoc('doc', 'polyline', setPolyline);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polyline');

        done();
    });


    it('create a new item with multipolyline geometry', async done => {

        await createDoc('doc', 'polyline', setMultiPolyline);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipolyline');

        done();
    });


    it('create a new item with polygon geometry', async done => {

        await createDoc('doc', 'polygon', setPolygon);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polygon');

        done();
    });


    it('create a new item with multipolygon geometry', async done => {

        await createDoc('doc', 'polygon', setMultiPolygon);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipolygon');

        done();
    });


    it('delete a point geometry', async done => {

        await createDocThenReedit('doc', 'point', setPoint);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('delete a polyline geometry', async done => {

        await createDocThenReedit('doc', 'polyline', setPolyline);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('delete a polygon geometry', async done => {

        await createDocThenReedit('doc', 'polygon', setPolygon);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('delete single polygons of a multipolygon', async done => {

        await createDocThenReedit('doc', 'polygon', setMultiPolygon);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForLayoverToDisappear();
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polygon');

        await ResourcesPage.clickSelectResource('doc');
        await GeometryViewPage.performReeditGeometry('doc');
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('delete single polylines of a multipolyline', async done => {

        await createDocThenReedit('doc', 'polyline', setMultiPolyline);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForLayoverToDisappear();
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polyline');

        await ResourcesPage.clickSelectResource('doc');
        await GeometryViewPage.performReeditGeometry('doc');
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('delete single points of a multipoint', async done => {

        await createDocThenReedit('doc', 'point', setMultiPoint);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForLayoverToDisappear();
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Punkt');

        await ResourcesPage.clickSelectResource('doc');
        await GeometryViewPage.performReeditGeometry('doc');
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('ok');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('create a point geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'point');
        await MapPage.setMarker(100, 100);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Punkt');

        done();
    });


    it('create a multipoint geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'point').then(setMultiPoint);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipunkt');

        done();
    });


    it('create a polyline geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polyline').then(setPolyline);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polyline');

        done();
    });


    it('create a multipolyline geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polyline').then(setMultiPolyline);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipolyline');

        done();
    });


    it('create a polygon geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polygon').then(setPolygon);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polygon');

        done();
    });


    it('create a multipolygon geometry later', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polygon').then(setMultiPolygon);
        await MapPage.clickMapOption('ok');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipolygon');

        done();
    });


    it('cancel creating a point geometry', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'point');
        await MapPage.setMarker(100, 100);
        await MapPage.clickMapOption('abort');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('cancel creating a polyline geometry', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polyline');
        await setPolyline();
        await MapPage.clickMapOption('abort');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('cancel creating a polygon geometry', async done => {

        await ResourcesPage.performCreateResource('doc');
        await GeometryViewPage.clickCreateGeometry('doc', 'polygon').then(setPolygon);
        await MapPage.clickMapOption('abort');
        await GeometryViewPage.waitForCreateGeoButtons('doc');

        done();
    });


    it('cancel deleting a point geometry', async done => {

        await createDocThenReedit('doc', 'point', setPoint);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('abort');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Punkt');

        done();
    });


    it('cancel deleting a polyline geometry', async done => {

        await createDocThenReedit('doc', 'polyline', setPolyline);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('abort');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polyline');

        done();
    });


    it('cancel deleting a polygon geometry', async done => {

        await createDocThenReedit('doc', 'polygon', setPolygon);
        await MapPage.clickMapOption('delete');
        await MapPage.clickMapOption('abort');
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polygon');

        done();
    });


    it('abort item creation completely when aborting geometry editing', async done => {

        await beginCreateDocWithGeometry('point');
        await waitForExist(await ResourcesPage.getListItemMarkedNewEl());
        await setPoint();
        await MapPage.clickMapOption('abort');
        await waitForNotExist(await ResourcesPage.getListItemMarkedNewEl());
        expect(await getUrl()).toContain('resources');
        expect(await getUrl()).not.toContain('edit');

        done();
    });


    it('autofinish polyline geometry', async done => {

        await createDoc('doc', 'polyline', setUnfinishedPolyline);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Polyline');

        done();
    });


    it('autofinish multipolyline geometry', async done => {

        await createDoc('doc', 'polyline', setUnfinishedMultiPolyline);
        expect(await GeometryViewPage.getSelectedGeometryTypeText('doc')).toContain('Multipolyline');

        done();
    });


    it('remove and add layers in layer menu', async done => {

        await NavbarPage.clickTab('project');
        await MapPage.clickLayerButton();

        let labels = await MapPage.getLayerLabels(0);
        expect(labels.length).toBe(2);
        expect(await getText(labels[0])).toEqual('Kartenhintergrund 1');
        expect(await getText(labels[1])).toEqual('Kartenhintergrund 2');

        await MapPage.clickEditLayersButton();
        await MapPage.clickRemoveLayerButton(0);
        await MapPage.clickSaveLayersButton();

        labels = await MapPage.getLayerLabels(0);
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Kartenhintergrund 2');

        await MapPage.clickLayerButton();
        await ResourcesPage.clickHierarchyButton('S1');
        await MapPage.clickLayerButton();

        labels = await MapPage.getLayerLabels(0);
        expect(labels.length).toBe(0);
        labels = await MapPage.getLayerLabels(1);
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Kartenhintergrund 2');

        await MapPage.clickEditLayersButton();
        await MapPage.clickAddLayersButton();
        await ImagePickerModalPage.waitForCells();
        await click((await ImagePickerModalPage.getCells())[0]);
        await ImagePickerModalPage.clickAddImage();
        await MapPage.clickSaveLayersButton();

        labels = await MapPage.getLayerLabels(0);
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Kartenhintergrund 1');
        labels = await MapPage.getLayerLabels(1);
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Kartenhintergrund 2');
        await MapPage.clickLayerButton();

        done();
    });


    it('do not allow adding an image to more than one layer group', async done => {

        await MapPage.clickLayerButton();

        await MapPage.clickEditLayersButton();
        await MapPage.clickAddLayersButton();
        await pause(500);
        expect((await ImagePickerModalPage.getCells()).length).toBe(0);

        await ImagePickerModalPage.clickCloseButton();
        await MapPage.clickCancelEditingLayersButton();
        await MapPage.clickLayerButton();

        await NavbarPage.clickTab('project');
        await MapPage.clickLayerButton();
        await MapPage.clickEditLayersButton();
        await MapPage.clickRemoveLayerButton(0);
        await MapPage.clickSaveLayersButton();
        await MapPage.clickLayerButton();

        await ResourcesPage.clickHierarchyButton('S1');
        await MapPage.clickLayerButton();

        await MapPage.clickEditLayersButton();
        await MapPage.clickAddLayersButton();
        await ImagePickerModalPage.waitForCells();
        expect((await ImagePickerModalPage.getCells()).length).toBe(1);

        await ImagePickerModalPage.clickCloseButton();
        await MapPage.clickCancelEditingLayersButton();
        await MapPage.clickLayerButton();

        done();
    });
});
