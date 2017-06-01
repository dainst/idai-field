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
    @Input() editMode: string; // polygon | point | none

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private editablePolygons: Array<L.Polygon>;
    private editableMarker: L.Marker;

    public ngOnChanges(changes: SimpleChanges) {

        super.ngOnChanges(changes);

        this.resetEditing();

        switch (this.editMode) {
            case 'none':
                break;
            case 'polygon':
                this.fadeOutMapElements();
                this.startPolygonCreation();
                break;
            case 'point':
                this.fadeOutMapElements();
                this.startPointCreation();
                break;
            case 'existing':
                this.fadeOutMapElements();
                this.editExistingGeometry();
                break;
        }
    }

    private editExistingGeometry() {

        switch (this.selectedDocument.resource.geometry.type) {
            case 'Polygon':
            case 'MultiPolygon':
                this.editMode = "polygon";
                this.startPolygonEditing();
                break;
            case 'Point':
                this.editMode = "point";
                this.startPointEditing();
                break;
        }
    }

    private startPolygonCreation() {

        var drawOptions = {
            templineStyle: { color: 'red' },
            hintlineStyle: { color: 'red' }
        };

        this.map.pm.enableDraw('Poly', drawOptions);

        var mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            let polygon: L.Polygon = <L.Polygon> event.layer;
            mapComponent.editablePolygons.push(polygon);
            mapComponent.setupEditablePolygon(polygon);
        });
    }

    private startPolygonEditing() {

        this.editablePolygons = this.polygons[this.selectedDocument.resource.id];

        for (let polygon of this.editablePolygons) {
            polygon.unbindTooltip();
            this.setupEditablePolygon(polygon);
        }
    }

    private setupEditablePolygon(polygon: L.Polygon) {

        polygon.setStyle({ color: 'red', fillColor: 'red' });
        polygon.pm.enable({draggable: true, snappable: true, snapDistance: 30 });

        var mapComponent = this;
        polygon.on('pm:edit', function() {
            if (this._latlngs[0].length < 2) {
                mapComponent.deleteGeometry();
            }
        });
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

    public deleteGeometry() {

        this.resetEditing();

        if (this.editMode == 'polygon') {
            this.startPolygonCreation();
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

        if (this.editableMarker) {
            this.map.removeLayer(this.editableMarker);
        }

        this.editablePolygons = [];
        this.editableMarker = undefined;

        this.map.pm.disableDraw('Poly');
    }

    private fadeOutMapElements() {

        for (let i in this.polygons) {
            for (let polygon of this.polygons[i]) {
                if (polygon.document.resource.id != this.selectedDocument.resource.id) {
                    polygon.setStyle({opacity: 0.25, fillOpacity: 0.1});
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

    protected clickOnMap(clickPosition: L.LatLng) {

        switch(this.editMode) {
            case 'point':
                this.setEditableMarkerPosition(clickPosition);
                break;
            case 'none':
                this.deselect();
                break;
        }
    }

    protected select(document: IdaiFieldDocument): boolean {

        if (this.editMode == 'none') {
            this.onSelectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }

    protected deselect() {

        if (this.editMode == 'none') {
            this.onSelectDocument.emit(null);
        }
    }
}