import {Component, Input, Output, EventEmitter, OnChanges, SecurityContext} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {IdaiFieldImageResource} from "../../model/idai-field-image-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";
import {IdaiFieldGeometry} from "../../model/idai-field-geometry";
import {MapState} from './map-state';
import {Datastore, Mediastore} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {BlobProxy} from "../../common/blob-proxy";
import {IdaiFieldMapLayer} from "./idai-field-map-layer";

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

    @Output() onSelectDocument: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();
    @Output() onQuitEditing: EventEmitter<IdaiFieldGeometry> = new EventEmitter<IdaiFieldGeometry>();

    private blobProxy: BlobProxy;

    private map: L.Map;
    private polygons: { [resourceId: string]: IdaiFieldPolygon } = {};
    private markers: { [resourceId: string]: IdaiFieldMarker } = {};

    private bounds: L.LatLngBounds;

    private editablePolygon: L.Polygon;
    private editableMarker: L.Marker;

    private layers: { [id: string]: IdaiFieldMapLayer } = {};
    private activeLayers: Array<IdaiFieldMapLayer> = [];
    private panes: { [id: string]: any } = {};

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

    constructor(
        private mapState: MapState,
        private datastore: Datastore,
        private mediastore: Mediastore,
        private sanitizer: DomSanitizer
    ) {
        this.blobProxy = new BlobProxy(mediastore, sanitizer);
    }

    public ngAfterViewInit() {

        this.map.invalidateSize(false);
    }

    public ngOnChanges() {

        if (!this.map) {
            this.initializeMap();
        } else {
            this.clearMap();
        }

        this.initializeLayers().then(
            () => {
                this.initializePanes();
                this.addActiveLayersFromMapState();
                var layers = this.getLayersAsList();
                if (this.activeLayers.length == 0 && layers.length > 0) {
                    this.addLayerToMap(layers[0]);
                    this.saveActiveLayersIdsInMapState();
               }
            }
        );

        this.bounds = L.latLngBounds(L.latLng(-1.0, -1.0), L.latLng(1.0, 1.0));

        for (var i in this.documents) {
            var resource = this.documents[i].resource;
            for (var j in resource.geometries) {
                this.addToMap(resource.geometries[j], this.documents[i]);
            }
        }

        setTimeout(function() {

            this.map.invalidateSize(true);

            if (this.selectedDocument) {
                if (this.polygons[this.selectedDocument.resource.id]) {
                    this.focusPolygon(this.polygons[this.selectedDocument.resource.id]);
                } else if (this.markers[this.selectedDocument.resource.id]) {
                    this.focusMarker(this.markers[this.selectedDocument.resource.id]);
                }
            } else {
                this.map.fitBounds(this.bounds);
            }
        }.bind(this), 1);

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

        this.map = L.map("map-container", { crs: L.CRS.Simple, attributionControl: false });

        var mapComponent = this;
        this.map.on('click', function(event: L.MouseEvent) {
            mapComponent.clickOnMap(event.latlng);
        });

        this.initializeViewport();
        this.initializeViewportMonitoring();
        this.map.pm.addControls({drawPolygon: false, editPolygon: false, deleteLayer: false});
    }

    private initializeViewport() {

        if (this.mapState.getCenter() && this.mapState.getZoom()) {
            this.map.setView(this.mapState.getCenter(), this.mapState.getZoom());
        } else {
            this.map.setView([0, 0], 5);
        }
    }

    private initializeViewportMonitoring() {

        this.map.on('moveend', function () {
            this.mapState.setCenter(this.map.getCenter());
            this.mapState.setZoom(this.map.getZoom());
        }.bind(this));
    }

    private initializeLayers(): Promise<any> {

        return new Promise((resolve, reject) => {

            var query = {q: '', filters: [{'field': 'type', 'value': 'image', invert: false}]};
            this.datastore.find(query).then(
                documents => this.makeLayersForDocuments(documents, resolve),
                error => {
                    reject(error);
                });
        });
    }

    private makeLayersForDocuments(documents: Array<Document>, resolve: any) {

        var zIndex: number = 0;
        var promises: Array<Promise<any>> = [];
        for (var i in documents) {
            var resource: any = documents[i].resource;
            if (resource.georeference && !this.layers[resource.id]) {
                var promise = this.makeLayerForImageResource(resource, zIndex++);
                promises.push(promise);
            }
        }
        Promise.all(promises).then(() => resolve());
    }

    private makeLayerForImageResource(resource: IdaiFieldImageResource, zIndex: number) {

        var callback = (resource) => url => {
            var layer: IdaiFieldMapLayer = {
                id: resource.id,
                name: resource.shortDescription,
                filePath: this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, url),
                georeference: resource.georeference,
                zIndex: zIndex
            };
            this.layers[resource.id] = layer;

            return new Promise<any>((resolve) => resolve());
        };

        var promise = this.blobProxy.urlForImage(resource.identifier);
        return promise.then(callback(resource));
    }

    private initializePanes() {

        var layers = this.getLayersAsList();
        for (var i in layers) {
            var id = layers[i].id;
            if (!this.panes[id]) {
                var pane = this.map.createPane(id);
                pane.style.zIndex = String(layers[i].zIndex);
                this.panes[id] = pane;
            }
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

    private addToMap(geometry: any, document: IdaiFieldDocument) {

        switch(geometry.type) {
            case "Point":
                var marker: IdaiFieldMarker = this.addMarkerToMap(geometry, document);
                this.bounds.extend(marker.getLatLng());
                break;
            case "Polygon":
                var polygon: IdaiFieldPolygon = this.addPolygonToMap(geometry, document);
                for (var latLng of polygon.getLatLngs()) {
                    this.bounds.extend(latLng);
                }
                break;
        }
    }

    private addMarkerToMap(geometry: any, document: IdaiFieldDocument): IdaiFieldMarker {

        var latLng = L.latLng(geometry.coordinates);

        var icon = (document == this.selectedDocument) ? this.markerIcons.darkblue : this.markerIcons.blue;

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

        var polygon: IdaiFieldPolygon = L.polygon(geometry.coordinates);
        polygon.document = document;

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

    private addLayerToMap(layer: IdaiFieldMapLayer) {

        layer.object = L.imageOverlay.rotated(layer.filePath,
            layer.georeference.topLeftCoordinates,
            layer.georeference.topRightCoordinates,
            layer.georeference.bottomLeftCoordinates,
            { pane: layer.id }).addTo(this.map);

        this.activeLayers.push(layer);
    }

    public toggleLayer(layer: IdaiFieldMapLayer) {

        var index = this.activeLayers.indexOf(layer);
        if (index == -1) {
            this.addLayerToMap(layer);
        } else {
            this.activeLayers.splice(index, 1);
            this.map.removeLayer(layer.object);
        }

        this.saveActiveLayersIdsInMapState();
    }

    public isActiveLayer(layer: any) {

        return this.activeLayers.indexOf(layer) > -1;
    }

    private saveActiveLayersIdsInMapState() {

        var activeLayersIds: Array<string> = [];

        for (var i in this.activeLayers) {
            activeLayersIds.push(this.activeLayers[i].id);
        }

        this.mapState.setActiveLayersIds(activeLayersIds);
    }

    private addActiveLayersFromMapState() {

        var activeLayersIds: Array<string> = this.mapState.getActiveLayersIds();

        for (var i in activeLayersIds) {
            var layerId = activeLayersIds[i];
            var layer = this.layers[layerId];
            if (layer && this.activeLayers.indexOf(layer) == -1) {
                this.addLayerToMap(layer);
            }
        }
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

    private getShortDescription(resource: IdaiFieldResource) {

        var shortDescription = resource.identifier;
        if (resource.shortDescription && resource.shortDescription.length > 0) {
            shortDescription += " | " + resource.shortDescription;
        }

        return shortDescription;
    }

    private clickOnMap(clickPosition: L.LatLng) {

        switch(this.editMode) {
            case "point":
                this.setEditableMarkerPosition(clickPosition);
                break;
            case "none":
                this.deselect();
                break;
        }
    }

    private select(document: IdaiFieldDocument): boolean {

        if (this.editMode == "none") {
            this.onSelectDocument.emit(document);
            return true;
        } else {
            return false;
        }
    }

    private deselect() {

        if (this.editMode == "none") {
            this.onSelectDocument.emit(null);
        }
    }

    private editExistingGeometry() {

        switch (this.selectedDocument.resource.geometries[0].type) {
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
            geometry.coordinates = this.getPolygonCoordinates(this.editablePolygon);
        } else if (this.editableMarker) {
            geometry.type = "Point";
            geometry.coordinates = [this.editableMarker.getLatLng().lat, this.editableMarker.getLatLng().lng];
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

    private getLayersAsList(): Array<IdaiFieldMapLayer> {

        var layersList: Array<IdaiFieldMapLayer> = [];

        for (var i in this.layers) {
            if (this.layers.hasOwnProperty(i)) {
                layersList.push(this.layers[i]);
            }
        }

        return layersList.sort((layer1, layer2) => layer1.zIndex - layer2.zIndex);
    }
}



