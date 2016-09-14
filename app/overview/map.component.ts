import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldResource} from '../model/idai-field-resource';

@Component({
    selector: 'map',
    template: `<div id="mapContainer"></div>`
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() resource: IdaiFieldResource;

    private map: L.Map;
    private mapElements: Array<L.ILayer> = [];

    
    public ngOnChanges() {

        if (!this.map) {
            this.initializeMap();
        } else {
            this.clearMap();
            this.map.setView([0, 0], 5);
        }

        for (var i in this.resource.geometries) {
            this.show(this.resource.geometries[i]);
        }
    }

    private initializeMap() {

        this.map = L.map("mapContainer", { crs: L.CRS.Simple }).setView([0, 0], 5);
        L.tileLayer("").addTo(this.map);
    }

    private clearMap() {

        for (var i in this.mapElements) {
            this.map.removeLayer(this.mapElements[i]);
        }

        this.mapElements = [];
    }
    
    private show(geometry: any) {

        switch(geometry.type) {
            case "Point":
                this.showPoint(geometry);
                break;
            case "Polygon":
                this.showPolygon(geometry);
                break;
        }
    }

    private showPoint(geometry: any) {

        var latLng = L.latLng(geometry.coordinates);
        var marker = L.marker(latLng).addTo(this.map);
        this.mapElements.push(marker);
    }

    private showPolygon(geometry: any) {

        var polygon = L.polygon(geometry.coordinates).addTo(this.map);
        this.mapElements.push(polygon);
    }
}