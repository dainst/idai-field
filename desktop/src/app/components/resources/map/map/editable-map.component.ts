import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, NgZone, Output,
    SimpleChanges } from '@angular/core';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { FieldDocument, FieldGeometry, Labels, PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { Menus } from '../../../../services/menus';
import { SettingsProvider } from '../../../../services/settings/settings-provider';
import { Messages } from '../../../messages/messages';
import { FieldMarker } from './field-marker';
import { FieldPolygon } from './field-polygon';
import { FieldPolyline } from './field-polyline';
import { GeometryHelper } from './geometry-helper';
import { LayerMapComponent } from './layer-map.component';
import { LayerImageProvider } from './layers/layer-image-provider';
import { LayerManager } from './layers/layer-manager';


declare global { namespace L { namespace PM { namespace Draw { interface Line { _finishShape(): void
                     _layer: any } }
     interface Draw { Line: L.PM.Draw.Line } } }
}

type DrawMode = 'None'|'Line'|'Poly';


@Component({
    selector: 'editable-map',
    templateUrl: './editable-map.html'
})
/**
 * @author Thomas Kleinke
 */
export class EditableMapComponent extends LayerMapComponent {

    @Input() isEditing: boolean;

    @Output() onQuitEditing: EventEmitter<FieldGeometry> =
        new EventEmitter<FieldGeometry>();

    public mousePositionCoordinates: string[]|undefined;

    private editableMarkers: Array<L.CircleMarker>;
    public selectedMarker: L.CircleMarker;

    private editablePolylines: Array<L.Polyline>;
    public selectedPolyline: L.Polyline;

    private editablePolygons: Array<L.Polygon>;
    public selectedPolygon: L.Polygon;

    public dragging: boolean = false;

    private drawMode: DrawMode = 'None';


    constructor(projectConfiguration: ProjectConfiguration,
                labels: Labels,
                layerManager: LayerManager,
                layerImageProvider: LayerImageProvider,
                messages: Messages,
                settingsProvider: SettingsProvider,
                datastore: PouchdbDatastore,
                menuService: Menus,
                protected zone: NgZone,
                protected changeDetectorRef: ChangeDetectorRef) {

        super(projectConfiguration, labels, layerManager, layerImageProvider, messages, settingsProvider, zone,
            changeDetectorRef, datastore, menuService);
    }


    @HostListener('document:keyup', ['$event'])
    public handleKeyEvent(event: KeyboardEvent) {

        if (event.key == 'Escape') this.finishDrawing();
    }


    public addPolygon() {

        this.zone.runOutsideAngular(() => {
            this.addPolyLayer('Poly');
            this.redrawGeometries();
        });
    }


    public addPolyline() {

        this.zone.runOutsideAngular(() => {
            this.addPolyLayer('Line');
            this.redrawGeometries();
        });
    }


    public addMarker() {

        this.zone.runOutsideAngular(() => {
            const marker: L.CircleMarker = this.createEditableMarker(this.map.getCenter());
            this.setSelectedMarker(marker);
            this.redrawGeometries();
        });
    }


    public abortEditing() {

        this.zone.runOutsideAngular(() => {
            this.fadeInMapElements();
            this.resetEditing();
        });

        this.onQuitEditing.emit(undefined as any);
    }


    public finishEditing() {

        let geometry: FieldGeometry|null = null;

        this.zone.runOutsideAngular(() => {
            if (this.drawMode !== 'None') this.finishDrawing();
            geometry = this.createGeometry();
            this.fadeInMapElements();
            this.resetEditing();
        });

        this.onQuitEditing.emit(geometry);
    }


    private createGeometry(): FieldGeometry|null {

        if (this.editablePolygons.length === 1) {
            return {
                type: 'Polygon',
                coordinates: GeometryHelper.getCoordinatesFromPolygon(this.editablePolygons[0])
            };
        } else if (this.editablePolygons.length > 1) {
            return {
                type: 'MultiPolygon',
                coordinates: GeometryHelper.getCoordinatesFromPolygons(this.editablePolygons)
            };
        } else if (this.editablePolylines.length === 1) {
            return {
                type: 'LineString',
                coordinates: GeometryHelper.getCoordinatesFromPolyline(this.editablePolylines[0])
            };
        } else if (this.editablePolylines.length > 1) {
            return {
                type: 'MultiLineString',
                coordinates: GeometryHelper.getCoordinatesFromPolylines(this.editablePolylines)
            };
        } else if (this.editableMarkers.length === 1) {
            return {
                type: 'Point',
                coordinates: GeometryHelper.getCoordinatesFromMarker(this.editableMarkers[0])
            };
        } else if (this.editableMarkers.length > 1) {
            return {
                type: 'MultiPoint',
                coordinates: GeometryHelper.getCoordinatesFromMarkers(this.editableMarkers)
            };
        } else {
            return null;
        }
    }


    public getEditorType(): string|undefined {

        if (!this.isEditing || !this.selectedDocument || !this.selectedDocument.resource
            || !this.selectedDocument.resource.geometry) {
            return 'none';
        }

        switch(this.selectedDocument.resource.geometry.type) {
            case 'Polygon':
            case 'MultiPolygon':
                return 'polygon';

            case 'LineString':
            case 'MultiLineString':
                return 'polyline';

            case 'Point':
            case 'MultiPoint':
                return 'point';
        }
    }


    public deleteGeometry() {

        this.zone.runOutsideAngular(() => {
            if (this.getEditorType() === 'polygon' && this.selectedPolygon) {
                this.removePolygon(this.selectedPolygon);
                if (this.editablePolygons.length > 0) {
                    this.setSelectedPolygon(this.editablePolygons[0]);
                } else {
                    this.selectedPolygon = undefined as any;
                }
            } else if (this.getEditorType() === 'polyline' && this.selectedPolyline) {
                this.removePolyline(this.selectedPolyline);
                if (this.editablePolylines.length > 0) {
                    this.setSelectedPolyline(this.editablePolylines[0]);
                } else {
                    this.selectedPolyline = undefined as any;
                }
            } else if (this.getEditorType() === 'point' && this.selectedMarker) {
                this.removeMarker(this.selectedMarker);
                if (this.editableMarkers.length > 0) {
                    this.setSelectedMarker(this.editableMarkers[0]);
                } else {
                    this.selectedMarker = undefined as any;
                }
            }

            this.redrawGeometries();
        });
    }


    public toggleDragMode() {

        this.zone.runOutsideAngular(() => {

            if (this.dragging) {
                this.editablePolygons.forEach(polygon => this.disableDragging(polygon));
                this.editablePolylines.forEach(polyline => this.disableDragging(polyline));
                this.map.dragging.enable();
            } else {
                this.editablePolygons.forEach(polygon => this.enableDragging(polygon));
                this.editablePolylines.forEach(polyline => this.enableDragging(polyline));
                this.map.dragging.disable();
            }

            this.dragging = !this.dragging;

            this.redrawGeometries();
        });
    }


    private enableDragging(layer: any) {

        layer.pm.disable();
        layer.pm.enableLayerDrag();
    }


    private disableDragging(layer: any) {

        layer.pm.disableLayerDrag();
        if (this.selectedPolygon === layer || this.selectedPolyline === layer) layer.pm.enable();
    }


    private finishDrawing() {

        if (this.dragging) this.toggleDragMode();

        if (this.drawMode === 'Line' && (this.map.pm.Draw).Line._layer.getLatLngs().length >= 2) {
            ((this.map.pm.Draw).Line)._finishShape();
        } else if (this.drawMode !== 'None') {
            this.map.pm.disableDraw(this.drawMode);
        }

        this.drawMode = 'None';
    }


    private createEditableMarker(position: L.LatLng): L.CircleMarker {

        const editableMarker: L.CircleMarker = L.circleMarker(
            position, this.getMarkerOptions(this.selectedDocument)
        );
        this.setupMouseDownEvent(editableMarker);
        editableMarker.addTo(this.map);
        this.editableMarkers.push(editableMarker);

        return editableMarker;
    }


    private setSelectedMarkerPosition(position: L.LatLng) {

        if (this.selectedMarker) this.selectedMarker.setLatLng(position);
    }


    private addPolyLayer(drawMode: DrawMode) {

        if (this.drawMode !== 'None') this.finishDrawing();
        if (this.dragging) this.toggleDragMode();

        const drawOptions: any = {
            templineStyle: { color: 'blue', weight: 1 },
            hintlineStyle: { color: 'blue', weight: 1, dashArray: '5' },
            pathOptions: {
                color: this.projectConfiguration.getCategory(this.selectedDocument).color,
                weight: drawMode === 'Line' ? 2 : 1
            },
            tooltips: false
        };

        if (drawMode === 'Poly') drawOptions.pathOptions.fillOpacity = 0.5;

        this.map.pm.enableDraw(drawMode, drawOptions);
        this.drawMode = drawMode;
    }


    private resetEditing() {

        if (this.dragging) this.toggleDragMode();

        if (this.editablePolygons) {
            this.editablePolygons.forEach((polygon: any) => {
                polygon.pm.disable();
                this.map.removeLayer(polygon);
            });
        }

        if (this.editablePolylines) {
            this.editablePolylines.forEach((polyline: any) => {
                polyline.pm.disable();
                this.map.removeLayer(polyline);
            });
        }

        if (this.editableMarkers) {
            this.editableMarkers.forEach(marker => this.map.removeLayer(marker));
        }

        this.editablePolygons = [];
        this.editablePolylines = [];
        this.editableMarkers = [];

        this.map.dragging.enable();
        if (this.drawMode !== 'None') this.map.pm.disableDraw(this.drawMode);
        this.drawMode = 'None';

        this.map.off('pm:create');
        this.hideMousePositionCoordinates();

        this.redrawGeometries();
    }


    private fadeOutMapElements() {

        if (!this.selectedDocument) return;

        this.callForUnselected(this.polygons, (polygon: FieldPolygon) => {
            polygon.setStyle({ opacity: 0.25, fillOpacity: 0.1, interactive: false });
        });

        this.callForUnselected(this.polylines, (polyline: FieldPolyline) => {
            polyline.setStyle({ opacity: 0.25, interactive: false });
        });

        this.callForUnselected(this.markers, (marker: FieldMarker) => {
            marker.setStyle({ fillOpacity: 0.5, interactive: false });
        });
    }


    private fadeInMapElements() {

        this.callForUnselected(this.polygons, (polygon: FieldPolygon) => {
            polygon.setStyle({ opacity: 0.5, fillOpacity: 0.2, interactive: true });
        });

        this.callForUnselected(this.polylines, (polyline: FieldPolyline) => {
            polyline.setStyle({ opacity: 0.5, interactive: true });
        });

        this.callForUnselected(this.markers, (marker: FieldMarker) => {
            marker.setStyle({ fillOpacity: 1, interactive: true });
        });
    }


    private callForUnselected(geometryMap: { [resourceId: string]: Array<L.Layer> },
                               funct: (geometry: L.Layer) => void) {

        Object.values(geometryMap || {}).forEach(
            (geometries: Array<L.Layer>) => {
                geometries.filter((geometry: any) => this.isUnselected(geometry))
                    .forEach((geometry: any) => funct(geometry));
            }
        );
    }


    private isUnselected(element: FieldPolygon|FieldPolyline|FieldMarker) {

        return element.document && element.document.resource.id !== this.selectedDocument.resource.id;
    }


    protected async updateMap(changes: SimpleChanges): Promise<void> {

        if (!this.update) return Promise.resolve();

        if (!changes['isEditing'] || !this.isEditing
                || EditableMapComponent.hasGeometry(this.selectedDocument)) {
            await super.updateMap(changes);
        }

        this.resetEditing();

        if (this.isEditing) {
            this.map.doubleClickZoom.disable();
            this.showMousePositionCoordinates();

            if ((this.selectedDocument.resource.geometry as any).coordinates) {
                this.fadeOutMapElements();
                this.editExistingGeometry();
                this.redrawGeometries();
            } else {
                switch (this.getEditorType()) {
                    case 'polygon':
                        this.fadeOutMapElements();
                        this.startPolygonCreation();
                        break;
                    case 'polyline':
                        this.fadeOutMapElements();
                        this.startPolylineCreation();
                        break;
                    case 'point':
                        this.fadeOutMapElements();
                        this.startPointCreation();
                        break;
                }
            }
        } else {
            this.map.doubleClickZoom.enable();
            this.hideMousePositionCoordinates();
        }
    }


    protected clickOnMap(clickPosition: L.LatLng) {

        if (!this.selectedDocument) return;

        switch(this.getEditorType()) {
            case 'point':
                this.setSelectedMarkerPosition(clickPosition);
                break;
            case 'none':
                this.deselect();
                break;
        }
    }


    protected select(document: FieldDocument, multiSelect: boolean = false): boolean {

        return this.isEditing
            ? false
            : super.select(document, multiSelect);
    }


    protected deselect() {

        if (!this.isEditing) super.deselect();
    }


    private editExistingGeometry() {

        switch (this.getEditorType()) {
            case 'polygon':
                this.startPolygonEditing();
                break;
            case 'polyline':
                this.startPolylineEditing();
                break;
            case 'point':
                this.startPointEditing();
                break;
        }
    }


    private startPolygonCreation() {

        this.setupPolygonCreation();
        this.addPolygon();
    }


    private startPolygonEditing() {

        this.setupPolygonCreation();

        this.editablePolygons = this.polygons[this.selectedDocument.resource.id as any];

        if (!this.editablePolygons) return;

        for (let polygon of this.editablePolygons) {
            polygon.unbindTooltip();
            polygon.bringToFront();
            this.setupEditablePolygon(polygon);
        }

        if (this.editablePolygons.length > 0) {
            this.setSelectedPolygon(this.editablePolygons[0]);
        }
    }


    private setupPolygonCreation() {

        const mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            const polygon: L.Polygon = <L.Polygon> event.layer;
            const latLngs: Array<any> = polygon.getLatLngs();
            if (latLngs.length == 1 && latLngs[0].length >= 3) {
                mapComponent.editablePolygons.push(polygon);
                mapComponent.setupEditablePolygon(polygon);
                mapComponent.setSelectedPolygon(polygon);
            } else {
                mapComponent.map.removeLayer(polygon);
                mapComponent.addPolygon();
            }
            mapComponent.drawMode = 'None';
        });
    }


    private setupEditablePolygon(polygon: L.Polygon) {

        const mapComponent = this;
        polygon.on('click', function() {
            if (!mapComponent.dragging) mapComponent.setSelectedPolygon(this);
        });
    }


    private setSelectedPolygon(polygon: any) {

        if (this.selectedPolygon) {
            (this.selectedPolygon as any).pm.disable();
        }

        polygon.pm.enable({ snappable: true, snapDistance: 30 });
        this.selectedPolygon = polygon;
    }


    private removePolygon(polygon: any) {

        polygon.pm.disable();
        this.map.removeLayer(polygon);
        EditableMapComponent.removeElement(polygon, this.editablePolygons);
    }


    private startPolylineCreation() {

        this.setupPolylineCreation();
        this.addPolyline();
    }


    private startPolylineEditing() {

        this.setupPolylineCreation();

        this.editablePolylines = this.polylines[this.selectedDocument.resource.id as any];

        for (let polyline of this.editablePolylines) {
            polyline.unbindTooltip();
            polyline.bringToFront();
            this.setupEditablePolyline(polyline);
        }

        if (this.editablePolylines.length > 0) {
            this.setSelectedPolyline(this.editablePolylines[0]);
        }
    }


    private setupPolylineCreation() {

        const mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            let polyline: L.Polyline = <L.Polyline> event.layer;
            if (polyline.getLatLngs().length >= 2) {
                mapComponent.editablePolylines.push(polyline);
                mapComponent.setupEditablePolyline(polyline);
                mapComponent.setSelectedPolyline(polyline);
            } else {
                mapComponent.map.removeLayer(polyline);
                mapComponent.addPolyline();
            }
            mapComponent.drawMode = 'None';
        });
    }


    private setupEditablePolyline(polyline: L.Polyline) {

        const mapComponent = this;
        polyline.on('click', function() {
            if (!mapComponent.dragging) mapComponent.setSelectedPolyline(this);
        });
    }


    private setSelectedPolyline(polyline: any) {

        if (this.selectedPolyline) {
            (this.selectedPolyline as any).pm.disable();
        }

        polyline.pm.enable({ snappable: true, snapDistance: 30 });

        const mapComponent = this;
        polyline.on('pm:edit', function() {
            if (this.getLatLngs().length <= 1) mapComponent.deleteGeometry();
        });
        this.selectedPolyline = polyline;
    }


    private removePolyline(polyline: any) {

        polyline.pm.disable();
        this.map.removeLayer(polyline);
        EditableMapComponent.removeElement(polyline, this.editablePolylines);
    }


    private startPointEditing() {

        this.editableMarkers = this.markers[this.selectedDocument.resource.id];

        for (let editableMarker of this.editableMarkers) {
            editableMarker.setStyle({ stroke: false });
            editableMarker.unbindTooltip();
            this.setupMouseDownEvent(editableMarker);
        }

        if (this.editableMarkers.length > 0) {
            this.setSelectedMarker(this.editableMarkers[0]);
        }

        this.setupMapMouseUpEvent();
    }


    private setupMouseDownEvent(editableMarker: L.CircleMarker) {

        editableMarker.on('mousedown', event => {
            this.setSelectedMarker(event.target);
            this.map.dragging.disable();
            this.map.on('mousemove', (e: L.MouseEvent) => editableMarker.setLatLng(e.latlng));
        });
    }


    private setupMapMouseUpEvent() {

        this.map.on('mouseup',() => {
            this.map.dragging.enable();
            this.map.removeEventListener('mousemove' as any);
        });
    }


    private setSelectedMarker(marker: L.CircleMarker) {

        if (this.selectedMarker) this.selectedMarker.setStyle({ stroke: false });

        marker.setStyle({ stroke: true });

        this.selectedMarker = marker;
    }


    private startPointCreation() {

        this.addMarker();
        this.setupMapMouseUpEvent();
    }


    private removeMarker(marker: L.CircleMarker) {

        this.map.removeLayer(marker);
        EditableMapComponent.removeElement(marker, this.editableMarkers);
    }


    private showMousePositionCoordinates() {

        this.map.addEventListener('mousemove', (event: any) => this.updateMousePositionCoordinates(event['latlng']));
        this.map.addEventListener('mouseout', () => this.mousePositionCoordinates = undefined);
    }


    private hideMousePositionCoordinates() {

        this.map.off('mousemove');
        this.map.off('mouseout');

        this.zone.run(() => {
            this.mousePositionCoordinates = undefined;
        });
    }


    private updateMousePositionCoordinates(latLng: L.LatLng) {

        this.zone.run(() => {
            this.mousePositionCoordinates = [
                latLng.lng.toFixed(7),
                latLng.lat.toFixed(7)
            ];
        });
    }


    private redrawGeometries() {

        setTimeout(() => {
            this.polygonsArray.forEach(polygon => polygon.redraw());
            this.polylinesArray.forEach(polyline => polyline.redraw());
            this.markersArray.forEach(marker => marker.redraw());
        }, 10);
    }


    private static removeElement(element: any, list: Array<any>) {

        for (let listElement of list) {
            if (element === listElement) {
                list.splice(list.indexOf(element), 1);
            }
        }
    }


    private static hasGeometry(document: FieldDocument): boolean {

        return document !== undefined && document.resource.geometry !== undefined
            && document.resource.geometry.coordinates !== undefined;
    }
}
