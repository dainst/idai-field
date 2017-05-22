import {Component, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {IdaiFieldDocument} from '../../model/idai-field-document';
import {IdaiFieldResource} from '../../model/idai-field-resource';
import {IdaiFieldPolygon} from './idai-field-polygon';
import {IdaiFieldMarker} from './idai-field-marker';
import {IdaiFieldGeometry} from '../../model/idai-field-geometry';
import {MapState} from './map-state';
import {Datastore} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';

@Component({
    moduleId: module.id,
    selector: 'map',
    template: '<div id="map-container"></div>'
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;
    @Input() selectedDocument: IdaiFieldDocument;

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    protected map: L.Map;
    protected polygons: { [resourceId: string]: IdaiFieldPolygon } = {};
    protected markers: { [resourceId: string]: IdaiFieldMarker } = {};

    protected bounds: any[]; // in fact L.LatLng[], but leaflet typings are incomplete

    protected markerIcons = {
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

    constructor(
        protected mapState: MapState,
        protected datastore: Datastore,
        protected messages: Messages
    ) {
        this.bounds = [];
    }

    public ngAfterViewInit() {

        if (this.map) {
            this.map.invalidateSize(false);
        }
    }

    public ngOnChanges(changes: SimpleChanges) {

        if (!this.map) {
            this.map = this.createMap();
        } else {
            this.clearMap();
        }

        this.bounds = [];
        for (var i in this.documents) {
            if (this.documents[i].resource.geometry) {
                this.addToMap(this.documents[i].resource.geometry, this.documents[i]);
            }
        }

        this.setView();
    }

    private createMap(): L.Map {

        const map = L.map("map-container", { crs: L.CRS.Simple, attributionControl: false, minZoom: -1000 });

        var mapComponent = this;
        map.on('click', function(event: L.MouseEvent) {
            mapComponent.clickOnMap(event.latlng);
        });

        this.initializeViewport(map);
        this.initializeViewportMonitoring(map);

        return map;
    }

    private initializeViewport(map: L.Map) {

        if (this.mapState.getCenter()) {
            map.setView(this.mapState.getCenter(), this.mapState.getZoom());
        } else {
            map.setView([0, 0], 5);
        }
    }

    private initializeViewportMonitoring(map: L.Map) {

        map.on('moveend', function () {
            this.mapState.setCenter(map.getCenter());
            this.mapState.setZoom(map.getZoom());
        }.bind(this));
    }

    protected setView() {

        this.map.invalidateSize(true);

        if (this.selectedDocument) {
            if (this.polygons[this.selectedDocument.resource.id]) {
                this.focusPolygon(this.polygons[this.selectedDocument.resource.id]);
            } else if (this.markers[this.selectedDocument.resource.id]) {
                this.focusMarker(this.markers[this.selectedDocument.resource.id]);
            }
        } else if (!this.mapState.getCenter() && this.bounds.length > 1) {
            this.map.fitBounds(L.latLngBounds(this.bounds));
        }
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

    protected extendBounds(latLng: L.LatLng) {
        this.bounds.push(latLng);
    }

    private addToMap(geometry: any, document: IdaiFieldDocument) {

        switch(geometry.type) {
            case "Point":
                var marker: IdaiFieldMarker = this.addMarkerToMap(geometry, document);
                this.extendBounds(marker.getLatLng());
                break;
            case "Polygon":
                var polygon: IdaiFieldPolygon = this.addPolygonToMap(geometry, document);
                for (var latLng of polygon.getLatLngs()) {
                    this.extendBounds(latLng);
                }
                break;
        }
    }

    private addMarkerToMap(geometry: any, document: IdaiFieldDocument): IdaiFieldMarker {

        var latLng = L.latLng([geometry.coordinates[1], geometry.coordinates[0]]);

        var icon = (document == this.selectedDocument) ? this.markerIcons.red : this.markerIcons.blue;

        var marker: IdaiFieldMarker = L.marker(latLng, {
            icon: icon
        });
        marker.document = document;

        marker.bindTooltip(this.getShortDescription(document.resource), {
            offset: L.point(0, -40),
            direction: 'top',
            opacity: 1.0});

        var mapComponent = this;
        marker.on('click', function() {
            mapComponent.select(this.document);
        });

        marker.addTo(this.map);
        this.markers[document.resource.id] = marker;

        return marker;
    }

    private addPolygonToMap(geometry: any, document: IdaiFieldDocument): IdaiFieldPolygon {

        var polygon: IdaiFieldPolygon = this.getPolygonFromCoordinates(geometry.coordinates);
        polygon.document = document;

        if (document == this.selectedDocument) {
            polygon.setStyle({color: 'red'});
        }

        polygon.bindTooltip(this.getShortDescription(document.resource), {
            direction: 'center',
            opacity: 1.0});

        var mapComponent = this;
        polygon.on('click', function(event: L.Event) {
            if (mapComponent.select(this.document)) L.DomEvent.stop(event);
        });

        polygon.addTo(this.map);
        this.polygons[document.resource.id] = polygon;

        return polygon;
    }

    private focusMarker(marker: L.Marker) {

        this.map.panTo(marker.getLatLng(), { animate: true, easeLinearity: 0.3 });
    }

    private focusPolygon(polygon: L.Polygon) {

        this.map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
    }

    private getShortDescription(resource: IdaiFieldResource) {

        var shortDescription = resource.identifier;
        if (resource.shortDescription && resource.shortDescription.length > 0) {
            shortDescription += " | " + resource.shortDescription;
        }

        return shortDescription;
    }

    protected clickOnMap(clickPosition: L.LatLng) {

        this.deselect();
    }

    protected select(document: IdaiFieldDocument): boolean {

        this.onSelectDocument.emit(document);
        return true;
    }

    protected deselect() {

        this.onSelectDocument.emit(null);
    }

    private getPolygonFromCoordinates(coordinates: Array<any>): L.Polygon {

        var feature = L.polygon(coordinates).toGeoJSON();
        return L.polygon(<any> feature.geometry.coordinates[0]);
    }
}
