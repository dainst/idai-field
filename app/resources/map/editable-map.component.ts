import {Component, SimpleChanges, Input, Output, EventEmitter} from '@angular/core';
import {LayerMapComponent} from './layer-map.component';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';

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
    @Input() editMode: boolean;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private editableMarker: L.Marker;

    private editablePolylines: Array<L.Polyline>;
    private selectedPolyline: L.Polyline;

    private editablePolygons: Array<L.Polygon>;
    private selectedPolygon: L.Polygon;

    public ngOnChanges(changes: SimpleChanges) {

        super.ngOnChanges(changes);

        this.resetEditing();

        if (this.editMode) {
            if (this.selectedDocument.resource.geometry.coordinates) {
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
        }
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

        var mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) { 
            let polygon: L.Polygon = <L.Polygon> event.layer; 
            mapComponent.editablePolygons.push(polygon); 
            mapComponent.setupEditablePolygon(polygon); 
            mapComponent.setSelectedPolygon(polygon);
        });
    }

    private setupEditablePolygon(polygon: L.Polygon) {

        polygon.setStyle({ color: 'red', fillColor: 'red' });

        var mapComponent = this;
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

        var mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            let polyline: L.Polyline = <L.Polyline> event.layer;
            mapComponent.editablePolylines.push(polyline);
            mapComponent.setupEditablePolyline(polyline);
            mapComponent.setSelectedPolyline(polyline);
        });
    }

    private setupEditablePolyline(polyline: L.Polyline) {

        polyline.setStyle({ color: 'red' });

        var mapComponent = this;
        polyline.on('click', function() {
            mapComponent.setSelectedPolyline(this);
        });
    }

    private setSelectedPolyline(polyline: L.Polyline) {

        if (this.selectedPolyline) {
            this.selectedPolyline.pm.disable();
        }

        polyline.pm.enable({draggable: true, snappable: true, snapDistance: 30 });
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
        this.editableMarker.unbindTooltip();
        this.editableMarker.setIcon(this.markerIcons.red);
        this.editableMarker.dragging.enable();
        this.editableMarker.setZIndexOffset(1000);
    }

    private createEditableMarker(position: L.LatLng) {

        this.editableMarker = L.marker(position, { icon: this.markerIcons.red, draggable: true, zIndexOffset: 1000 });
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

    private addPolyLayer(drawMode: string) {

        const drawOptions = {
            templineStyle: { color: 'red' },
            hintlineStyle: { color: 'red' }
        };

        this.map.pm.enableDraw(drawMode, drawOptions);
    }

    public deleteGeometry() {

        if (this.selectedDocument.resource.geometry.type == 'polygon' && this.selectedPolygon) {
            this.removePolygon(this.selectedPolygon);
            if (this.editablePolygons.length > 0) {
                this.setSelectedPolygon(this.editablePolygons[0]);
            } else {
                this.addPolygon();
            }
        } else if (this.selectedDocument.resource.geometry.type == 'polyline' && this.selectedPolyline) {
            this.removePolyline(this.selectedPolyline);
            if (this.editablePolylines.length > 0) {
                this.setSelectedPolyline(this.editablePolylines[0]);
            } else {
                this.addPolyline();
            }
        } else {
            this.resetEditing();
        }
    }

    public finishEditing() {

        var geometry: IdaiFieldGeometry = { type: '', coordinates: [], crs: 'local' };

        if (this.editablePolygons.length == 1) {
            geometry.type = 'Polygon';
            geometry.coordinates = this.getCoordinatesFromPolygon(this.editablePolygons[0]);
        } else if (this.editablePolygons.length > 1) {
            geometry.type = 'MultiPolygon';
            geometry.coordinates = this.getCoordinatesFromPolygons(this.editablePolygons);
        } else if (this.editablePolylines.length == 1) {
            geometry.type = 'LineString';
            geometry.coordinates = this.getCoordinatesFromPolyline(this.editablePolylines[0]);
        } else if (this.editablePolylines.length > 1) {
            geometry.type = 'MultiLineString';
            geometry.coordinates = this.getCoordinatesFromPolylines(this.editablePolylines);
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

        this.map.pm.disableDraw('Poly');
        this.map.pm.disableDraw('Line');

        this.map.off('pm:create');
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

    private getCoordinatesFromPolygons(polygons: Array<L.Polygon>): number[][][][] {

        let coordinates = [];

        for (let polygon of polygons) {
            coordinates.push(this.getCoordinatesFromPolygon(polygon));
        }

        return coordinates;
    }

    private getCoordinatesFromPolygon(polygon: L.Polygon): number[][][] {

        var coordinates = [];
        var latLngs = polygon.getLatLngs();

        for (var i in latLngs) {
            coordinates.push([]);
            for (var j in latLngs[i]) {
                coordinates[i].push([ latLngs[i][j].lng , latLngs[i][j].lat ]);
            }
        }

        return coordinates;
    }

    private getCoordinatesFromPolylines(polylines: Array<L.Polyline>): number[][][] {

        let coordinates = [];

        for (let polyline of polylines) {
            coordinates.push(this.getCoordinatesFromPolyline(polyline));
        }

        return coordinates;
    }

    private getCoordinatesFromPolyline(polyline: L.Polyline): number[][] {

        var coordinates = [];
        var latLngs = polyline.getLatLngs();

        for (var i in latLngs) {
            coordinates.push([ latLngs[i].lng , latLngs[i].lat ]);
        }

        return coordinates;
    }

    protected clickOnMap(clickPosition: L.LatLng) {
        if(!this.selectedDocument) return;
        switch(this.selectedDocument.resource.geometry.type) {
            case "point":
                this.setEditableMarkerPosition(clickPosition);
                break;
            case 'none':
                this.deselect();
                break;
        }
    }

    protected select(document: IdaiFieldDocument): boolean {
        if (!this.editMode) {
            this.onSelectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }

    protected deselect() {
        if (!this.editMode) {
            this.onSelectDocument.emit(null);
        }
    }

    private removeElement(element: any, list: Array<any>) {

        for (let listElement of list) {
            if (element == listElement) {
                list.splice(list.indexOf(element), 1);
            }
        }
    }

    public getEditorType(): string {

        if (!this.selectedDocument || !this.selectedDocument.resource || !this.selectedDocument.resource.geometry)
            return 'none';

        if (this.selectedDocument.resource.geometry.type == 'Polygon' ||
            this.selectedDocument.resource.geometry.type == 'MultiPolygon')
            return 'polygon';

        if (this.selectedDocument.resource.geometry.type == 'LineString' ||
            this.selectedDocument.resource.geometry.type == 'MultiLineString')
            return 'polyline';

        if (this.selectedDocument.resource.geometry.type == 'Point')
            return 'point';
    }
}