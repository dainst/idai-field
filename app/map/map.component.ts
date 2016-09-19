import {Component, Input, OnChanges} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IdaiFieldResource} from "../model/idai-field-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";

@Component({
    moduleId: module.id,
    selector: 'map',
    templateUrl: '../../templates/map.html'
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() documents: any;

    private map: L.Map;
    private mapElements: Array<L.Layer> = [];

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
            this.map.setView([0, 0], 5);
        }

        for (var i in this.documents) {
            var resource = this.documents[i].resource;
            for (var j in resource.geometries) {
                this.addToMap(resource.geometries[j], this.documents[i]);
            }
        }
    }

    private initializeMap() {

        this.map = L.map("mapContainer", { crs: L.CRS.Simple }).setView([0, 0], 5);

        for (var i in this.layers) {
            var pane = this.map.createPane(this.layers[i].name);
            pane.style.zIndex = this.layers[i].zIndex;
        }

        this.activeLayers.push(this.layers[0]);
        this.addLayerToMap(this.layers[0]);
    }

    private clearMap() {

        for (var i in this.mapElements) {
            this.map.removeLayer(this.mapElements[i]);
        }

        this.mapElements = [];
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
            mapComponent.router.navigate(['resources',this.document.resource.id]);
        });

        marker.addTo(this.map);
        this.mapElements.push(marker);
    }

    private addPolygonToMap(geometry: any, document: IdaiFieldDocument) {

        var polygon: IdaiFieldPolygon = L.polygon(geometry.coordinates);
        polygon.document = document;

        var mapComponent = this;
        polygon.on('click', function() {
            mapComponent.router.navigate(['resources',this.document.resource.id]);
        });

        polygon.addTo(this.map);
        this.mapElements.push(polygon);
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
}



