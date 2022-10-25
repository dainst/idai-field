import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnChanges, Output,
    SimpleChanges } from '@angular/core';
import { FieldDocument, FieldGeometry, CategoryForm, ProjectConfiguration } from 'idai-field-core';
import { FieldPolyline } from './field-polyline';
import { FieldPolygon } from './field-polygon';
import { FieldMarker } from './field-marker';
import { MapComponentHelper as Helper } from './map-component-helper';


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
    @Input() additionalSelectedDocuments: Array<FieldDocument>;
    @Input() parentDocument: FieldDocument;
    @Input() coordinateReferenceSystem: string;
    @Input() update: boolean;

    @Output() onSelectDocument: EventEmitter<{ document: FieldDocument|undefined, multiSelect: boolean }>
        = new EventEmitter<{ document: FieldDocument|undefined, multiSelect: boolean }>();

    protected map: any;
    protected polygons: { [resourceId: string]: Array<FieldPolygon> } = {};
    protected polylines: { [resourceId: string]: Array<FieldPolyline> } = {};
    protected markers: { [resourceId: string]: Array<FieldMarker> } = {};

    protected polygonsArray: Array<FieldPolygon> = [];
    protected polylinesArray: Array<FieldPolyline> = [];
    protected markersArray: Array<FieldMarker> = [];

    protected polygonsLayerGroup: L.LayerGroup;
    protected polylinesLayerGroup: L.LayerGroup;
    protected markersLayerGroup: L.LayerGroup;

    protected bounds: any[] = []; // in fact L.LatLng[], but leaflet typings are incomplete

    private canvasRenderer: L.Canvas = L.canvas({ padding: 1 });


    constructor(protected projectConfiguration: ProjectConfiguration,
                protected zone: NgZone) {}


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
            renderer: this.canvasRenderer
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

        if (Helper.hasOnlySelectionChanged(changes) && this.getNumberOfGeometriesOnMap() > 0) {
            this.updateSelectedGeometries(Helper.getPreviousSelection(changes));
        } else {
            this.resetMap();
        }

        return this.setView();
    }


    private resetMap() {

        this.clearMap();
        this.addGeometriesToMap();
        this.updateCoordinateReferenceSystem();
    }


    private updateSelectedGeometries(previousSelection: Array<FieldDocument>) {

        const selectedDocuments: Array<FieldDocument> = this.getSelection();
        const deselectedDocuments: Array<FieldDocument> = Helper.getDeselectedDocuments(
            selectedDocuments, previousSelection
        );

        deselectedDocuments.forEach(deselected => this.setSelectionStyle(deselected, false));
        selectedDocuments.forEach(selected => this.setSelectionStyle(selected, true));
    }


    private setSelectionStyle(document: FieldDocument, selected: boolean) {

        if (!document.resource.geometry) return;

        switch(document.resource.geometry.type) {
            case 'Point':
            case 'MultiPoint':
                if (!this.markers[document.resource.id]) return;
                this.markers[document.resource.id].forEach(marker => {
                   marker.setStyle({ stroke: selected });
                });
                break;
            case 'LineString':
            case 'MultiLineString':
                if (!this.polylines[document.resource.id]) return;
                this.polylines[document.resource.id].forEach(polyline => {
                    polyline.setStyle({ opacity: selected ? 1 : 0.5 });
                });
                break;
            case 'Polygon':
            case 'MultiPolygon':
                if (!this.polygons[document.resource.id]) return;
                this.polygons[document.resource.id].forEach(polygon => {
                    polygon.setStyle({
                        opacity: selected ? 1 : 0.5,
                        fillOpacity: selected ? 0.5 : 0.2
                    });
                });
                break;
        }
    }


    protected setView(): Promise<any> {

        if (Helper.hasGeometries(this.getSelection())) {
            this.focusSelection();
        } else if (this.bounds.length > 1) {
            this.map.fitBounds(L.latLngBounds(this.bounds));
        } else if (this.bounds.length == 1) {
            this.map.setView(this.bounds[0], 15);
        } else {
            this.map.setView([0, 0], 15);
        }

        this.bringSelectedMarkersToFront();

        return Promise.resolve();
    }


    protected clearMap() {

        if (this.polygonsLayerGroup) this.map.removeLayer(this.polygonsLayerGroup);
        if (this.polylinesLayerGroup) this.map.removeLayer(this.polylinesLayerGroup);
        if (this.markersLayerGroup) this.map.removeLayer(this.markersLayerGroup);

        this.polygonsLayerGroup = undefined;
        this.polylinesLayerGroup = undefined;
        this.markersLayerGroup = undefined;

        this.polygons = {};
        this.polylines = {};
        this.markers = {};

        this.polygonsArray = [];
        this.polylinesArray = [];
        this.markersArray = [];
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

        this.polygonsLayerGroup = L.layerGroup(this.polygonsArray).addTo(this.map);
        this.polylinesLayerGroup = L.layerGroup(this.polylinesArray).addTo(this.map);
        this.markersLayerGroup = L.layerGroup(this.markersArray).addTo(this.map);
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

        const geometry: FieldGeometry|undefined = Helper.getGeometry(document);
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

        const marker: FieldMarker = L.circleMarker(latLng, this.getMarkerOptions(document));
        marker.document = document;

        marker.bindTooltip(Helper.getTooltipText(document.resource), {
            direction: 'top',
            opacity: 1.0
        });

        const mapComponent = this;
        marker.on('click', function(event: any) {
            mapComponent.onGeometryClick(event, this.document);
        });

        if (!this.markers[document.resource.id]) this.markers[document.resource.id] = [];
        this.markers[document.resource.id].push(marker);
        this.markersArray.push(marker);

        return marker;
    }


    private addPolylineToMap(coordinates: any, document: FieldDocument): FieldPolyline {

        const polyline: FieldPolyline = Helper.getPolylineFromCoordinates(coordinates);
        polyline.document = document;

        if (this.isParentDocument(document)) {
            this.setPathOptionsForParentDocument(polyline, document);
        } else {
            this.setPathOptions(polyline, document, 'polyline');
        }

        const polylines: Array<FieldPolyline> = this.polylines[document.resource.id as any] ?? [];
        polylines.push(polyline);
        this.polylines[document.resource.id as any] = polylines;
        this.polylinesArray.push(polyline);

        return polyline;
    }


    private addPolygonToMap(coordinates: any, document: FieldDocument): FieldPolygon {

        const polygon: FieldPolygon = Helper.getPolygonFromCoordinates(coordinates);
        polygon.document = document;

        if (this.isParentDocument(document)) {
            this.setPathOptionsForParentDocument(polygon, document);
        } else {
            this.setPathOptions(polygon, document, 'polygon');
        }

        const polygons: Array<FieldPolygon> = this.polygons[document.resource.id as any] ?? [];
        polygons.push(polygon);
        this.polygons[document.resource.id as any] = polygons;
        this.polygonsArray.push(polygon);

        return polygon;
    }


    private setPathOptions(path: L.Path, document: FieldDocument, type: 'polyline'|'polygon') {

        const style: L.PathOptions = {
            color: this.projectConfiguration.getCategory(document).color,
            weight: type === 'polyline' ? 2 : 1,
            opacity: this.getSelection().includes(document) ? 1 : 0.5
        };

        if (type === 'polygon') {
            style.fillOpacity = this.getSelection().includes(document) ? 0.5 : 0.2;
        }

        path.setStyle(style);

        path.bindTooltip(Helper.getTooltipText(document.resource), {
            direction: 'center',
            opacity: 1.0
        });

        const mapComponent = this;
        path.on('click', function (event: any) {
            mapComponent.onGeometryClick(event, this.document);
        });
    }


    private setPathOptionsForParentDocument(path: L.Path, document: FieldDocument) {

        path.setStyle({
            color: this.projectConfiguration.getCategory(document).color,
            weight: 2,
            dashArray: '5, 5, 1, 5',
            opacity: 0.2,
            fill: false,
            interactive: false
        });
    }


    private focusSelection() {

        const panOptions = { animate: true, easeLinearity: 0.3 };
        const selection = this.getSelection().filter(Helper.getGeometry);

        const bounds = Helper.addToBounds(
            this.markers, this.polygons, this.polylines, selection);

        if (bounds.length === 1) this.map.panTo(bounds[0], panOptions);
        else if (bounds.length > 1) this.map.fitBounds(bounds);
    }


    private bringSelectedMarkersToFront() {

        this.getSelection().forEach(document => {
            if (this.markers[document.resource.id]) {
                this.markers[document.resource.id].forEach(marker => marker.bringToFront());
            }
        });
    }


    protected clickOnMap(clickPosition: L.LatLng) {

        this.deselect();
    }


    private onGeometryClick(event: any, document: FieldDocument) {

        if (this.select(
            document,
            event.originalEvent.metaKey || event.originalEvent.ctrlKey
        )) {
            L.DomEvent.stop(event);
        }
    }


    protected select(document: FieldDocument, multiSelect: boolean): boolean {

        this.zone.run(() => {
            this.onSelectDocument.emit({ document: document, multiSelect: multiSelect });
        });

        return true;
    }


    protected deselect() {

        this.zone.run(() => {
            this.onSelectDocument.emit({ document: undefined, multiSelect: false } );
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


    protected getMarkerOptions(document: FieldDocument): L.CircleMarkerOptions {

        const color = this.projectConfiguration.getCategory(document).color;

        return {
            fillColor: color,
            fillOpacity: 1,
            radius: 5,
            stroke: this.getSelection().includes(document),
            color: CategoryForm.isBrightColor(color) ? '#000' : '#fff',
            weight: 2
        };
    }


    private getSelection(): Array<FieldDocument> {

        let result = [];
        if (this.selectedDocument) result.push(this.selectedDocument);
        result = result.concat(this.additionalSelectedDocuments);

        return result;
    }


    private getNumberOfGeometriesOnMap(): number {

        return this.polygonsArray.length
            + this.polylinesArray.length
            + this.markersArray.length;
    }
}
