import {AfterViewInit, Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FieldDocument, FieldResource, FieldGeometry} from 'idai-components-2';
import {FieldPolyline} from './field-polyline';
import {FieldPolygon} from './field-polygon';
import {FieldMarker} from './field-marker';
import {CoordinatesUtility} from './coordinates-utility';
import {ProjectConfiguration} from '../../../../core/configuration/project-configuration';


@Component({
    selector: 'map',
    template: '<div id="map-container"></div>'
})

/**
 * @author Thomas Kleinke
 */
export class MapComponent implements AfterViewInit, OnChanges {

    @Input() documents: Array<FieldDocument>;
    @Input() selectedDocument: FieldDocument;
    @Input() parentDocument: FieldDocument;
    @Input() coordinateReferenceSystem: string;
    @Input() update: boolean;

    @Output() onSelectDocument: EventEmitter<FieldDocument|undefined>
        = new EventEmitter<FieldDocument|undefined>();

    protected map: L.Map;
    protected polygons: { [resourceId: string]: Array<FieldPolygon> } = {};
    protected polylines: { [resourceId: string]: Array<FieldPolyline> } = {};
    protected markers: { [resourceId: string]: Array<FieldMarker> } = {};

    protected bounds: any[] = []; // in fact L.LatLng[], but leaflet typings are incomplete
    protected categoryColors: { [categoryName: string]: string } = {};


    constructor(projectConfiguration: ProjectConfiguration,
                protected zone: NgZone) {

        this.categoryColors = projectConfiguration.getCategoryColors();
    }


    public ngAfterViewInit() {

        this.zone.runOutsideAngular(() => {
            if (this.map) this.map.invalidateSize(false);
        });
    }


    public ngOnChanges(changes: SimpleChanges) {

        this.zone.runOutsideAngular(() => {
            if (!this.map) this.map = this.createMap();

            // The promise is necessary to make sure the map is updated based on the current map container size
            Promise.resolve().then(() => this.updateMap(changes));
        });
    }


    protected createMap(): L.Map {

        const mapOptions: L.MapOptions = {
            crs: this.getCoordinateReferenceSystem(),
            attributionControl: false,
            minZoom: -20,
            maxZoom: 30,
            maxBoundsViscosity: 0.7
        };

        const map: L.Map = L.map('map-container', mapOptions);

        const mapComponent = this;
        map.on('click', function(event: L.MouseEvent) {
            mapComponent.clickOnMap(event.latlng);
        });

        return map;
    }


    protected updateMap(changes: SimpleChanges): Promise<any> {

        if (!this.update) return Promise.resolve();

        this.clearMap();
        this.addGeometriesToMap();
        this.bringSelectedMarkersToFront();
        this.updateCoordinateReferenceSystem();

        return this.setView();
    }


    protected setView(): Promise<any> {

        this.map.invalidateSize(true);

        if (this.selectedDocument && MapComponent.getGeometry(this.selectedDocument)) {
            if (this.polygons[this.selectedDocument.resource.id as any]) {
                this.focusPolygons(this.polygons[this.selectedDocument.resource.id as any]);
            } else if (this.polylines[this.selectedDocument.resource.id as any]) {
                this.focusPolylines(this.polylines[this.selectedDocument.resource.id as any]);
            } else if (this.markers[this.selectedDocument.resource.id as any]) {
                this.focusMarkers(this.markers[this.selectedDocument.resource.id as any]);
            }
        } else if (this.bounds.length > 1) {
            this.map.fitBounds(L.latLngBounds(this.bounds));
        } else if (this.bounds.length == 1) {
            this.map.setView(this.bounds[0], 15);
        } else {
            this.map.setView([0, 0], 15);
        }

        return Promise.resolve();
    }


    protected clearMap() {

        for (let i in this.polygons) {
            for (let polygon of this.polygons[i]) {
                this.map.removeLayer(polygon);
            }
        }

        for (let i in this.polylines) {
            for (let polyline of this.polylines[i]) {
                this.map.removeLayer(polyline);
            }
        }

        for (let i in this.markers) {
            for (let marker of this.markers[i]) {
                this.map.removeLayer(marker);
            }
        }

        this.polygons = {};
        this.polylines = {};
        this.markers = {};
    }


    protected extendBounds(latLng: L.LatLng) {

        this.bounds.push(latLng);
    }


    private extendBoundsForMultipleLatLngs(latLngs: Array<any>) {

        // Check if latLngs is an array of LatLng objects or an array of arrays of LatLng objects.
        // This is necessary because getLatLngs() returns an array of LatLng objects for points and polylines but an
        // array of arrays of LatLng objects for polygons.
        if (!latLngs[0].lng) latLngs = latLngs[0];

        for (let latLng of latLngs) {
            this.extendBounds(latLng);
        }
    }


    protected addGeometriesToMap() {

        this.bounds = [];

        this.addParentDocumentGeometryToMap();

        if (this.documents) {
            for (let document of this.documents) {
                if (document.resource.geometry) this.addGeometryToMap(document);
            }
        }
    }


    protected addParentDocumentGeometryToMap() {

        if (!this.parentDocument || !this.parentDocument.resource.geometry) return;

        if (['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']
                .indexOf(this.parentDocument.resource.geometry.type) === -1) {
            return;
        }

        this.addGeometryToMap(this.parentDocument);
    }


    protected addGeometryToMap(document: FieldDocument) {

        const geometry: FieldGeometry|undefined = MapComponent.getGeometry(document);
        if (!geometry) return;

        switch(geometry.type) {
            case 'Point':
                let marker: FieldMarker = this.addMarkerToMap(geometry.coordinates, document);
                this.extendBounds(marker.getLatLng());
                break;
            case 'MultiPoint':
                for (let pointCoordinates of geometry.coordinates) {
                    let marker: FieldMarker = this.addMarkerToMap(pointCoordinates, document);
                    this.extendBounds(marker.getLatLng());
                }
                break;
            case 'LineString':
                let polyline: FieldPolyline = this.addPolylineToMap(geometry.coordinates, document);
                this.extendBoundsForMultipleLatLngs(polyline.getLatLngs());
                break;
            case 'MultiLineString':
                for (let polylineCoordinates of geometry.coordinates) {
                    let polyline: FieldPolyline = this.addPolylineToMap(polylineCoordinates, document);
                    this.extendBoundsForMultipleLatLngs(polyline.getLatLngs());
                }
                break;
            case 'Polygon':
                let polygon: FieldPolygon = this.addPolygonToMap(geometry.coordinates, document);
                this.extendBoundsForMultipleLatLngs(polygon.getLatLngs());
                break;
            case 'MultiPolygon':
                for (let polygonCoordinates of geometry.coordinates) {
                    let polygon: FieldPolygon = this.addPolygonToMap(polygonCoordinates, document);
                    this.extendBoundsForMultipleLatLngs(polygon.getLatLngs());
                }
                break;
        }
    }


    private addMarkerToMap(coordinates: any, document: FieldDocument): FieldMarker {

        const latLng = L.latLng([coordinates[1], coordinates[0]]);

        const color = this.categoryColors[document.resource.category];

        const marker: FieldMarker = L.circleMarker(latLng, {
            fillColor: color,
            fillOpacity: 1,
            radius: 7,
            stroke: document === this.selectedDocument,
            color: '#fff',
            weight: 2
        });
        marker.document = document;

        marker.bindTooltip(MapComponent.getShortDescription(document.resource), {
            direction: 'top',
            opacity: 1.0
        });

        const mapComponent = this;
        marker.on('click', function() {
            mapComponent.select(this.document);
        });

        marker.addTo(this.map);
        if (!this.markers[document.resource.id]) this.markers[document.resource.id] = [];
        this.markers[document.resource.id].push(marker);

        return marker;
    }


    private addPolylineToMap(coordinates: any, document: FieldDocument): FieldPolyline {

        const polyline: FieldPolyline = MapComponent.getPolylineFromCoordinates(coordinates);
        polyline.document = document;

        if (this.isParentDocument(document)) {
            this.setPathOptionsForParentDocument(polyline, document);
        } else {
            this.setPathOptions(polyline, document, 'polyline');
        }

        const polylines: Array<FieldPolyline>
            = this.polylines[document.resource.id as any] ? this.polylines[document.resource.id as any] : [];
        polylines.push(polyline);
        this.polylines[document.resource.id as any] = polylines;

        return polyline;
    }


    private addPolygonToMap(coordinates: any, document: FieldDocument): FieldPolygon {

        const polygon: FieldPolygon = MapComponent.getPolygonFromCoordinates(coordinates);
        polygon.document = document;

        if (this.isParentDocument(document)) {
            this.setPathOptionsForParentDocument(polygon, document);
        } else {
            this.setPathOptions(polygon, document, 'polygon');
        }

        const polygons: Array<FieldPolygon>
            = this.polygons[document.resource.id as any] ? this.polygons[document.resource.id as any] : [];
        polygons.push(polygon);
        this.polygons[document.resource.id as any] = polygons;

        return polygon;
    }


    private setPathOptions(path: L.Path, document: FieldDocument, className: string) {

        if (this.selectedDocument && this.selectedDocument.resource.id == document.resource.id) {
            className = className + ' active';
        }

        const style = { color: this.categoryColors[document.resource.category], className: className };

        path.setStyle(style);

        path.bindTooltip(MapComponent.getShortDescription(document.resource), {
            direction: 'center',
            opacity: 1.0
        });

        const mapComponent = this;
        path.on('click', function (event: L.Event) {
            if (mapComponent.select(this.document)) L.DomEvent.stop(event);
        });

        path.addTo(this.map);
    }


    private setPathOptionsForParentDocument(path: L.Path, document: FieldDocument) {

        path.setStyle({
            color: this.categoryColors[document.resource.category],
            className: 'parent',
            interactive: false
        });

        path.addTo(this.map);
    }


    private focusMarkers(markers: Array<L.CircleMarker>) {

        if (markers.length === 1) {
            this.map.panTo(markers[0].getLatLng(), { animate: true, easeLinearity: 0.3 });
        } else {
            const bounds = [] as any;
            for (let marker of markers) {
                bounds.push(marker.getLatLng());
            }
            this.map.fitBounds(bounds);
        }
    }


    private focusPolylines(polylines: Array<L.Polyline>) {

        const bounds = [] as any;
        for (let polyline of polylines) {
            bounds.push(polyline.getLatLngs());
        }
        this.map.fitBounds(bounds);
    }


    private focusPolygons(polygons: Array<L.Polygon>) {

        const bounds = [] as any;
        for (let polygon of polygons) {
            bounds.push(polygon.getLatLngs());
        }
        this.map.fitBounds(bounds);
    }


    private bringSelectedMarkersToFront() {

        if (this.selectedDocument && this.markers[this.selectedDocument.resource.id]) {
            this.markers[this.selectedDocument.resource.id].forEach(marker => marker.bringToFront());
        }
    }


    protected clickOnMap(clickPosition: L.LatLng) {

        this.deselect();
    }


    protected select(document: FieldDocument): boolean {

        this.zone.run(() => {
            this.onSelectDocument.emit(document);
        });

        return true;
    }


    protected deselect() {

        this.zone.run(() => {
            this.onSelectDocument.emit(undefined);
        });
    }


    protected isParentDocument(document: FieldDocument) {

        return this.parentDocument && this.parentDocument === document;
    }


    private updateCoordinateReferenceSystem() {

        this.map.options.crs = this.getCoordinateReferenceSystem();
    }


    private getCoordinateReferenceSystem(): L.CRS {

        if (!this.coordinateReferenceSystem) return L.CRS.Simple;

        switch (this.coordinateReferenceSystem) {
            case 'EPSG4326 (WGS 84)':
                return L.CRS.EPSG4326;
            case 'EPSG3857 (WGS 84 Web Mercator)':
                return L.CRS.EPSG3857;
            default:
                return L.CRS.Simple;
        }
    }


    private static getPolylineFromCoordinates(coordinates: Array<any>): L.Polyline {

        return L.polyline(<any> CoordinatesUtility.convertPolylineCoordinatesFromLngLatToLatLng(coordinates));
    }


    private static getPolygonFromCoordinates(coordinates: Array<any>): L.Polygon {

        return L.polygon(<any> CoordinatesUtility.convertPolygonCoordinatesFromLngLatToLatLng(coordinates));
    }


    private static getGeometry(document: FieldDocument): FieldGeometry|undefined {

        const geometry: FieldGeometry|undefined = document.resource.geometry;

        return (geometry && geometry.coordinates && geometry.coordinates.length > 0)
            ? geometry
            : undefined;
    }


    private static getShortDescription(resource: FieldResource) {

        let shortDescription = resource.identifier;
        if (resource.shortDescription && resource.shortDescription.length > 0) {
            shortDescription += ' | ' + resource.shortDescription;
        }

        return shortDescription;
    }
}
