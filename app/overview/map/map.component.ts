import {Component, Input, Output, EventEmitter, OnChanges} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";
import {IdaiFieldGeometry} from "../../model/idai-field-geometry";
import {MapState} from './map-state';

@Component({
    moduleId: module.id,
    selector: 'map',
    templateUrl: './map.html'
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;
    @Input() editMode: string; // polygon | point | none

    @Output() selectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() quitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private map: L.Map;
    private polygons: { [resourceId: string]: IdaiFieldPolygon } = {};
    private markers: { [resourceId: string]: IdaiFieldMarker } = {};

    private editablePolygon: L.Polygon;
    private editableMarker: L.Marker;

    private layers: Array<any> = [
        { name: "Karte 1", filePath: "img/mapLayerTest1.png", bounds: L.latLngBounds([-25, -25], [25, 25]), zIndex: 0 },
        { name: "Karte 2", filePath: "img/mapLayerTest2.png", bounds: L.latLngBounds([-25, -75], [25, -25]), zIndex: 1 }
    ];
    private activeLayers: Array<any> = [];

    private markerIcons = {
        'blue': L.icon({
            iconUrl: 'img/marker-icons/marker-icon-blue.png',
            shadowUrl: 'img/marker-icons/marker-shadow.png',
            iconSize:     [25, 41],
            shadowSize:   [41, 41],
            iconAnchor:   [12, 39],
            shadowAnchor: [13, 39]
        }),
        'darkblue': L.icon({
            iconUrl: 'img/marker-icons/marker-icon-darkblue.png',
            shadowUrl: 'img/marker-icons/marker-shadow.png',
            iconSize:     [25, 41],
            shadowSize:   [41, 41],
            iconAnchor:   [12, 39],
            shadowAnchor: [13, 39]
        }),
        'red': L.icon({
            iconUrl: 'img/marker-icons/marker-icon-red.png',
            shadowUrl: 'img/marker-icons/marker-shadow.png',
            iconSize:     [25, 41],
            shadowSize:   [41, 41],
            iconAnchor:   [12, 39],
            shadowAnchor: [13, 39]
        })
    };

    constructor(private mapState: MapState) {}

    public ngAfterViewInit() {
        console.log('here')
        this.map.invalidateSize(true);
    }

    public ngOnChanges() {

        if (!this.map) {
            this.initializeMap();
        } else {
            this.clearMap();
        }

        for (var i in this.documents) {
            var resource = this.documents[i].resource;
            for (var j in resource.geometries) {
                this.addToMap(resource.geometries[j], this.documents[i]);
            }
        }

        setTimeout(function() {

            if (this.selectedDocument) {

                this.map.invalidateSize(true);

                if (this.polygons[this.selectedDocument.resource.id]) {
                    this.focusPolygon(this.polygons[this.selectedDocument.resource.id]);
                } else if (this.markers[this.selectedDocument.resource.id]) {
                    this.focusMarker(this.markers[this.selectedDocument.resource.id]);
                }
            }
        }.bind(this), 100);

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

    private initializeMap() {

        this.map = L.map("map-container", { crs: L.CRS.Simple });

        for (var i in this.layers) {
            var pane = this.map.createPane(this.layers[i].name);
            pane.style.zIndex = this.layers[i].zIndex;
        }

        this.activeLayers.push(this.layers[0]);
        this.addLayerToMap(this.layers[0]);

        var mapComponent = this;
        this.map.on('click', function() {
            mapComponent.clickOnMap();
        });

        this.initializeViewport();
        this.initializeViewportMonitoring();
        this.map.pm.addControls({drawPolygon: false, editPolygon: false, deleteLayer: false});
    }

    private initializeViewport() {

        if (this.mapState.getCenter() && this.mapState.getZoom()) {
            this.map.setView(this.mapState.getCenter(), this.mapState.getZoom(), {});
        } else {
            this.map.setView([0, 0], 5);
        }
    }

    private initializeViewportMonitoring() {

        this.map.on('moveend',function(){
            this.mapState.setCenter(this.map.getCenter());
            this.mapState.setZoom(this.map.getZoom());
        }.bind(this));
    }

    private clearMap() {

        for (var i in this.polygons) {
            this.map.removeLayer(this.polygons[i]);
        }

        for (var i in this.markers) {
            this.map.removeLayer(this.markers[i]);
        }

        this.polygons = {};
        this.markers = {};
    }

    private addToMap(geometry: any, document: IdaiFieldDocument) {

        switch(geometry.type) {
            case "Point":
                this.addMarkerToMap(geometry, document);
                break;
            case "Polygon":
                this.addPolygonToMap(geometry, document);
                break;
        }
    }

    private addMarkerToMap(geometry: any, document: IdaiFieldDocument) {

        var latLng = L.latLng(geometry.coordinates);

        var icon = (document == this.selectedDocument) ? this.markerIcons.darkblue : this.markerIcons.blue;

        var marker: IdaiFieldMarker = L.marker(latLng, {
            icon: icon,
            title: this.getShortDescription(document.resource)
        });
        marker.document = document;

        var mapComponent = this;

        marker.on('click', function(e) {
            mapComponent.select(this.document);
        });

        marker.addTo(this.map);
        this.markers[document.resource.id] = marker;
    }

    private focusMarker(marker: L.Marker) {

        if (marker != this.editableMarker) {
            marker.setIcon(this.markerIcons.darkblue);
        }
        this.map.panTo(marker.getLatLng(), { animate: true, easeLinearity: 0.3 });
    }

    private focusPolygon(polygon: L.Polygon) {

        this.map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
    }

    private addPolygonToMap(geometry: any, document: IdaiFieldDocument) {

        var polygon: IdaiFieldPolygon = L.polygon(geometry.coordinates);
        polygon.document = document;

        var mapComponent = this;
        polygon.on('click', function(event: L.Event) {
            // TODO Wait for updated typings file to get rid of error message...
            if (mapComponent.select(this.document)) L.DomEvent.stop(event);
        });

        polygon.addTo(this.map);
        this.polygons[document.resource.id] = polygon;
    }

    private addLayerToMap(layer: any) {

        layer.object = L.imageOverlay(layer.filePath, layer.bounds, { pane: layer.name }).addTo(this.map);
    }

    private getShortDescription(resource: IdaiFieldResource) {

        var shortDescription = resource.id;
        if (resource.shortDescription && resource.shortDescription.length > 0) {
            shortDescription += " | " + resource.shortDescription;
        }

        return shortDescription;
    }

    public toggleLayer(layer: any) {

        var index = this.activeLayers.indexOf(layer);
        if (index == -1) {
            this.activeLayers.push(layer);
            this.addLayerToMap(layer);
        } else {
            this.activeLayers.splice(index, 1);
            this.map.removeLayer(layer.object);
        }
    }

    public isActiveLayer(layer: any) {

        return this.activeLayers.indexOf(layer) > -1;
    }

    private clickOnMap() {

        if (this.editMode == "none") {
            this.deselect();
        }
    }

    private select(document: IdaiFieldDocument): boolean {

        if (this.editMode == "none") {
            this.selectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }

    private deselect() {

        if (this.editMode == "none") {
            this.selectDocument.emit(null);
        }
    }

    private editExistingGeometry() {

        switch (this.selectedDocument.resource.geometries[0].type) {
            case 'Polygon':
                this.startPolygonEditing();
                break;
            case 'Point':
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
            mapComponent.editablePolygon.setStyle({ color: 'red', fillColor: 'red' });
            mapComponent.editablePolygon.pm.enable({ draggable: true, snappable: true, snapDistance: 30 });
        });
    }

    private startPolygonEditing() {

        this.editablePolygon = this.polygons[this.selectedDocument.resource.id];

        this.editablePolygon.setStyle({ color: 'red', fillColor: 'red' });
        this.editablePolygon.pm.enable({draggable: true, snappable: true, snapDistance: 30 });
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

    private startPointCreation() {

        var position = this.map.getCenter();

        this.editableMarker = L.marker(position, { icon: this.markerIcons.red, draggable: true, zIndexOffset: 1000 });
        this.editableMarker.addTo(this.map);
    }

    private startPointEditing() {

        this.editableMarker = this.markers[this.selectedDocument.resource.id];
        this.editableMarker.setIcon(this.markerIcons.red);
        this.editableMarker.dragging.enable();
        this.editableMarker.setZIndexOffset(1000);
    }

    public deleteGeometry() {

        this.resetEditing();
    }

    public finishEditing() {

        var geometry: IdaiFieldGeometry = { type: "", coordinates: [], crs: "local" };

        if (this.editablePolygon) {
            geometry.type = "Polygon";
            geometry.coordinates = this.getPolygonCoordinates(this.editablePolygon);
        } else if (this.editableMarker) {
            geometry.type = "Point";
            geometry.coordinates = [this.editableMarker.getLatLng().lat, this.editableMarker.getLatLng().lng];
        } else {
            geometry = null;
        }

        this.fadeInMapElements();
        this.resetEditing();

        this.quitEditing.emit(geometry);
    }

    public abortEditing() {

        this.fadeInMapElements();
        this.resetEditing();

        this.quitEditing.emit(undefined);
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

    private getPolygonCoordinates(polygon: L.Polygon): Array<any> {

        var coordinates = [];
        var latLngs = polygon.getLatLngs();

        for (var i in latLngs) {
            coordinates.push([]);
            for (var j in latLngs[i]) {
                coordinates[i].push([ latLngs[i][j].lat, latLngs[i][j].lng ]);
            }
        }

        return coordinates;
    }
}



