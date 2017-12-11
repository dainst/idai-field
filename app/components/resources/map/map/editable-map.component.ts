import {Component, SimpleChanges, Input, Output, EventEmitter, HostListener} from '@angular/core';
import {LayerMapComponent} from './layer-map.component';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {GeometryHelper} from './geometry-helper';

declare global { namespace L { namespace PM { namespace Draw { interface Line { _finishShape(): void
                    _layer: any } }
    interface Draw { Line: L.PM.Draw.Line } } }
}


@Component({
    moduleId: module.id,
    selector: 'editable-map',
    templateUrl: './editable-map.html'
})

/**
 * @author Thomas Kleinke
 */
export class EditableMapComponent extends LayerMapComponent {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() mainTypeDocument: IdaiFieldDocument;
    @Input() projectDocument: IdaiFieldDocument;
    @Input() update: boolean;
    @Input() isEditing: boolean;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument|undefined|null> =
        new EventEmitter<IdaiFieldDocument|undefined|null>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> =
        new EventEmitter<IdaiFieldGeometry>();

    public mousePositionCoordinates: string[]|undefined;

    private editableMarker: L.Marker|undefined;

    private editablePolylines: Array<L.Polyline>;
    private selectedPolyline: L.Polyline;

    private editablePolygons: Array<L.Polygon>;
    private selectedPolygon: L.Polygon;

    private drawMode: string = 'None';


    protected updateMap(changes: SimpleChanges): Promise<any> {

        if (!this.update) return Promise.resolve();

        super.updateMap(changes).then(() => {
            this.resetEditing();

            if (this.isEditing) {
                this.map.doubleClickZoom.disable();
                this.showMousePositionCoordinates();

                if ((this.selectedDocument.resource.geometry as any).coordinates) {
                    this.fadeOutMapElements();
                    this.editExistingGeometry();
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
        });
        return Promise.resolve();
    }


    @HostListener('document:keyup', ['$event'])
    public handleKeyEvent(event: KeyboardEvent) {

        if (event.key == 'Escape') this.finishDrawing();
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

        this.editablePolygons = this.polygons[this.selectedDocument.resource.id];

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
            let polygon: L.Polygon = <L.Polygon> event.layer; 
            let latLngs: Array<any> = polygon.getLatLngs();
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
            mapComponent.setSelectedPolygon(this);
        });
    }


    private setSelectedPolygon(polygon: L.Polygon) {

        if (this.selectedPolygon) {
            this.selectedPolygon.pm.disable();
        }

        polygon.pm.enable({draggable: true, snappable: true, snapDistance: 30 });
        this.selectedPolygon = polygon;
    }


    private removePolygon(polygon: L.Polygon) {

        polygon.pm.disable();
        this.map.removeLayer(polygon);  
        this.removeElement(polygon, this.editablePolygons);
    }


    private startPolylineCreation() {

        this.setupPolylineCreation();
        this.addPolyline();
    }


    private startPolylineEditing() {

        this.setupPolylineCreation();

        this.editablePolylines = this.polylines[this.selectedDocument.resource.id];

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
            mapComponent.setSelectedPolyline(this);
        });
    }


    private setSelectedPolyline(polyline: L.Polyline) {

        if (this.selectedPolyline) {
            this.selectedPolyline.pm.disable();
        }

        polyline.pm.enable({draggable: true, snappable: true, snapDistance: 30 });

        const mapComponent = this;
        polyline.on('pm:edit', function() {;
            if (this.getLatLngs().length <= 1) mapComponent.deleteGeometry();
        });
        this.selectedPolyline = polyline;
    }


    private removePolyline(polyline: L.Polyline) {

        polyline.pm.disable();
        this.map.removeLayer(polyline);
        this.removeElement(polyline, this.editablePolylines);
    }


    private startPointCreation() {

        this.createEditableMarker(this.map.getCenter());
    }


    private startPointEditing() {

        this.editableMarker = this.markers[this.selectedDocument.resource.id];
        if (!this.editableMarker) return;

        this.editableMarker.unbindTooltip();
        let color = this.typeColors[this.selectedDocument.resource.type];
        this.editableMarker.setIcon(this.generateMarkerIcon(color, 'active'));
        this.editableMarker.dragging.enable();
        this.editableMarker.setZIndexOffset(1000);
    }


    private createEditableMarker(position: L.LatLng) {

        let color = this.typeColors[this.selectedDocument.resource.type];
        this.editableMarker = L.marker(position, {
            icon: this.generateMarkerIcon(color, 'active'),
            draggable: true,
            zIndexOffset: 1000
        });
        this.editableMarker.addTo(this.map);
    }


    private setEditableMarkerPosition(position: L.LatLng) {

        if (!this.editableMarker) {
            this.createEditableMarker(position);
        } else {
            this.editableMarker.setLatLng(position);
        }
    }


    public addPolygon() {

        this.addPolyLayer('Poly');
    }


    public addPolyline() {

        this.addPolyLayer('Line');
    }


    public getEditorType(): string|undefined {

        if (!this.isEditing || !this.selectedDocument || !this.selectedDocument.resource
            || !this.selectedDocument.resource.geometry) {
            return 'none';
        }

        if (this.selectedDocument.resource.geometry.type == 'Polygon'
            || this.selectedDocument.resource.geometry.type == 'MultiPolygon') {
            return 'polygon';
        }

        if (this.selectedDocument.resource.geometry.type == 'LineString'
            || this.selectedDocument.resource.geometry.type == 'MultiLineString') {
            return 'polyline';
        }

        if (this.selectedDocument.resource.geometry.type == 'Point') {
            return 'point';
        }
    }


    private addPolyLayer(drawMode: string) {

        if (this.drawMode != 'None') this.finishDrawing();

        let className = drawMode == 'Poly' ? 'polygon' : 'polyline';
        className += ' active';

        const drawOptions = {
            templineStyle: { className: 'templine' },
            hintlineStyle: { className: 'hintline' },
            pathOptions: { className: className, color: this.typeColors[this.selectedDocument.resource.type] }
        };

        this.map.pm.enableDraw(drawMode, drawOptions);
        this.drawMode = drawMode;
    }


    private finishDrawing() {

        if (this.drawMode == 'Line' && this.map.pm.Draw.Line._layer.getLatLngs().length >= 2) {
            this.map.pm.Draw.Line._finishShape();
        } else if (this.drawMode != 'None') {
            this.map.pm.disableDraw(this.drawMode);
        }

        this.drawMode = 'None';
    }


    public deleteGeometry() {

        if (this.getEditorType() == 'polygon' && this.selectedPolygon) {
            this.removePolygon(this.selectedPolygon);
            if (this.editablePolygons.length > 0) {
                this.setSelectedPolygon(this.editablePolygons[0]);
            } else {
                this.selectedPolygon = undefined;
                this.addPolygon();
            }
        } else if (this.getEditorType() == 'polyline' && this.selectedPolyline) {
            this.removePolyline(this.selectedPolyline);
            if (this.editablePolylines.length > 0) {
                this.setSelectedPolyline(this.editablePolylines[0]);
            } else {
                this.selectedPolyline = undefined;
                this.addPolyline();
            }
        } else if (this.getEditorType() == 'point' && this.editableMarker) {
            this.resetEditing();
        }
    }


    public finishEditing() {

        if (this.drawMode != 'None') this.finishDrawing();

        let geometry: IdaiFieldGeometry|undefined|null = { type: '', coordinates: [] };

        if (this.editablePolygons.length == 1) {
            geometry.type = 'Polygon';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolygon(this.editablePolygons[0]);
        } else if (this.editablePolygons.length > 1) {
            geometry.type = 'MultiPolygon';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolygons(this.editablePolygons);
        } else if (this.editablePolylines.length == 1) {
            geometry.type = 'LineString';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolyline(this.editablePolylines[0]);
        } else if (this.editablePolylines.length > 1) {
            geometry.type = 'MultiLineString';
            geometry.coordinates = GeometryHelper.getCoordinatesFromPolylines(this.editablePolylines);
        } else if (this.editableMarker) {
            geometry.type = 'Point';
            geometry.coordinates = [this.editableMarker.getLatLng().lng, this.editableMarker.getLatLng().lat];
        } else {
            geometry = null;
        }

        this.fadeInMapElements();
        this.resetEditing();

        this.onQuitEditing.emit(geometry);
    }


    public abortEditing() {

        this.fadeInMapElements();
        this.resetEditing();

        this.onQuitEditing.emit(undefined);
    }


    private resetEditing() {

        if (this.editablePolygons) {
            for (let polygon of this.editablePolygons) {
                polygon.pm.disable();
                this.map.removeLayer(polygon);
            }
        }

        if (this.editablePolylines) {
            for (let polyline of this.editablePolylines) {
                polyline.pm.disable();
                this.map.removeLayer(polyline);
            }
        }

        if (this.editableMarker) {
            this.map.removeLayer(this.editableMarker);
        }

        this.editablePolygons = [];
        this.editablePolylines = [];
        this.editableMarker = undefined;

        if (this.drawMode != 'None') this.map.pm.disableDraw(this.drawMode);
        this.drawMode = 'None';

        this.map.off('pm:create');
        this.hideMousePositionCoordinates();
    }


    private fadeOutMapElements() {

        for (let i in this.polygons) {
            for (let polygon of this.polygons[i]) {
                if (polygon.document.resource.id != this.selectedDocument.resource.id) {
                    polygon.setStyle({opacity: 0.25, fillOpacity: 0.1});
                }
            }
        }

        for (let i in this.polylines) {
            for (let polyline of this.polylines[i]) {
                if (polyline.document.resource.id != this.selectedDocument.resource.id) {
                    polyline.setStyle({opacity: 0.25});
                }
            }
        }

        for (let i in this.markers) {
            if (this.markers[i].document.resource.id != this.selectedDocument.resource.id) {
                this.markers[i].setOpacity(0.5);
            }
        }
    }


    private fadeInMapElements() {

        for (let i in this.polygons) {
            for (let polygon of this.polygons[i]) {
                polygon.setStyle({opacity: 0.5, fillOpacity: 0.2});
            }
        }

        for (let i in this.polylines) {
            for (let polyline of this.polylines[i]) {
                polyline.setStyle({opacity: 0.5});
            }
        }

        for (let i in this.markers) {
            this.markers[i].setOpacity(1);
        }
    }


    protected clickOnMap(clickPosition: L.LatLng) {

        if (!this.selectedDocument) return;

        switch(this.getEditorType()) {
            case 'point':
                this.setEditableMarkerPosition(clickPosition);
                break;
            case 'none':
                this.deselect();
                break;
        }
    }


    protected select(document: IdaiFieldDocument): boolean {

        if (!this.isEditing) {
            this.onSelectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }


    protected deselect() {

        if (!this.isEditing) {
            this.onSelectDocument.emit(null);
        }
    }


    private showMousePositionCoordinates() {

        this.map.addEventListener('mousemove', event => this.updateMousePositionCoordinates(event['latlng']));
        this.map.addEventListener('mouseout', () => this.mousePositionCoordinates = undefined);
    }


    private hideMousePositionCoordinates() {

        this.map.off('mousemove');
        this.map.off('mouseout');
        this.mousePositionCoordinates = undefined;
    }


    private updateMousePositionCoordinates(latLng: L.LatLng) {

        this.mousePositionCoordinates = [latLng.lng.toFixed(7), latLng.lat.toFixed(7)];
    }


    private removeElement(element: any, list: Array<any>) {

        for (let listElement of list) {
            if (element == listElement) {
                list.splice(list.indexOf(element), 1);
            }
        }
    }
}