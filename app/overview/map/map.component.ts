import {Component, Input, Output, EventEmitter, OnChanges} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";
import {IdaiFieldGeometry} from "../../model/idai-field-geometry";

@Component({
    moduleId: module.id,
    selector: 'map',
    templateUrl: './map.html'
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() documents: any;
    @Input() editMode: string; // polygon | point | none
    
    @Output() selectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() quitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private map: L.Map;
    private polygons: Array<IdaiFieldPolygon> = [];
    private markers: Array<IdaiFieldMarker> = [];

    private editablePolygon: L.Polygon;

    private layers: Array<any> = [
        { name: "Karte 1", filePath: "img/mapLayerTest1.png", bounds: L.latLngBounds([-25, -25], [25, 25]), zIndex: 0 },
        { name: "Karte 2", filePath: "img/mapLayerTest2.png", bounds: L.latLngBounds([-25, -75], [25, -25]), zIndex: 1 }
    ];
    private activeLayers: Array<any> = [];

    constructor(private router: Router) {}

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

        switch (this.editMode) {
            case "polygon":
                this.fadeOutMapElements();
                this.startPolygonEditing();
                break;
            case "point":
                // TODO Start point editing
                this.fadeOutMapElements();
                break;
        }
    }

    private initializeMap() {

        this.map = L.map("map-container", { crs: L.CRS.Simple }).setView([0, 0], 5);

        for (var i in this.layers) {
            var pane = this.map.createPane(this.layers[i].name);
            pane.style.zIndex = this.layers[i].zIndex;
        }

        this.activeLayers.push(this.layers[0]);
        this.addLayerToMap(this.layers[0]);

        var mapComponent = this;
        this.map.on('click', function() {
            mapComponent.deselect();
        });

        this.map.pm.addControls({drawPolygon: false, editPolygon: false, deleteLayer: false});
    }

    private clearMap() {

        for (var i in this.polygons) {
            this.map.removeLayer(this.polygons[i]);
        }

        for (var i in this.markers) {
            this.map.removeLayer(this.markers[i]);
        }

        this.polygons = [];
        this.markers = [];
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
        var marker: IdaiFieldMarker = L.marker(latLng, { title: this.getShortDescription(document.resource) });
        marker.document = document;

        var mapComponent = this;
        marker.on('click', function() {
            mapComponent.select(this.document);
        });

        marker.addTo(this.map);
        this.markers.push(marker);
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
        this.polygons.push(polygon);
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

    private startPolygonEditing() {

        this.map.pm.enableDraw('Poly');
        
        var mapComponent = this;
        this.map.on('pm:create', function(event: L.LayerEvent) {
            mapComponent.editablePolygon = <L.Polygon> event.layer;
            mapComponent.editablePolygon.pm.enable({ draggable: true, snappable: true, snapDistance: 30 });
        });
    }

    private fadeOutMapElements() {

        for (var i in this.polygons) {
            this.polygons[i].setStyle({ opacity: 0.25, fillOpacity: 0.1 });
        }

        for (var i in this.markers) {
            this.markers[i].setOpacity(0.5);
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

    public finishEditing() {

        this.fadeInMapElements();
        
        var geometry: IdaiFieldGeometry = { type: "", coordinates: [], crs: "local" };
        
        switch (this.editMode) {
            case "polygon":
                geometry.type = "Polygon";
                geometry.coordinates = this.getPolygonCoordinates(this.editablePolygon);
                break;
            case "point":
                // TODO Implement point editing
                break;
            default:
                geometry = null;
        }

        this.quitEditing.emit(geometry);
    }

    public abortEditing() {

        this.fadeInMapElements();
        this.quitEditing.emit(null);
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



