import {Component, SimpleChanges, Input, Output, EventEmitter} from '@angular/core';
import {MapComponent} from './map.component';
import {IdaiFieldGeometry} from '../../model/idai-field-geometry';
import {IdaiFieldDocument} from '../../model/idai-field-document';

@Component({
    moduleId: module.id,
    selector: 'editable-map',
    templateUrl: './editable-map.html'
})

/**
 * @author Thomas Kleinke
 */
export class EditableMapComponent extends MapComponent {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() editMode: string; // polygon | point | none

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private editablePolygon: L.Polygon;
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
            mapComponent.editablePolygon = <L.Polygon> event.layer;
            mapComponent.setupEditablePolygon();
        });
    }

    private startPolygonEditing() {

        this.editablePolygon = this.polygons[this.selectedDocument.resource.id];
        this.editablePolygon.unbindTooltip();
        this.setupEditablePolygon();
    }

    private setupEditablePolygon() {

        this.editablePolygon.setStyle({ color: 'red', fillColor: 'red' });
        this.editablePolygon.pm.enable({draggable: true, snappable: true, snapDistance: 30 });

        var mapComponent = this;
        this.editablePolygon.on('pm:edit', function() {
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

        var geometry: IdaiFieldGeometry = { type: "", coordinates: [], crs: "local" };

        if (this.editablePolygon) {
            geometry.type = "Polygon";
            geometry.coordinates = this.getCoordinatesFromPolygon(this.editablePolygon);
        } else if (this.editableMarker) {
            geometry.type = "Point";
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

        if (this.editablePolygon) {
            this.editablePolygon.pm.disable();
            this.map.removeLayer(this.editablePolygon);
            this.editablePolygon = undefined;
        }

        if (this.editableMarker) {
            this.map.removeLayer(this.editableMarker);
            this.editableMarker = undefined;
        }

        this.map.pm.disableDraw('Poly');
    }

    private fadeOutMapElements() {

        for (var i in this.polygons) {
            if (this.polygons[i].document != this.selectedDocument) {
                this.polygons[i].setStyle({ opacity: 0.25, fillOpacity: 0.1 });
            }
        }

        for (var i in this.markers) {
            if (this.markers[i].document != this.selectedDocument) {
                this.markers[i].setOpacity(0.5);
            }
        }
    }

    private fadeInMapElements() {

        for (var i in this.polygons) {
            this.polygons[i].setStyle({ opacity: 0.5, fillOpacity: 0.2 });
        }

        for (var i in this.markers) {
            this.markers[i].setOpacity(1);
        }
    }

    private getCoordinatesFromPolygon(polygon: L.Polygon): Array<any> {

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
            case "point":
                this.setEditableMarkerPosition(clickPosition);
                break;
            case "none":
                this.deselect();
                break;
        }
    }

    protected select(document: IdaiFieldDocument): boolean {

        if (this.editMode == "none") {
            this.onSelectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }

    protected deselect() {

        if (this.editMode == "none") {
            this.onSelectDocument.emit(null);
        }
    }
}