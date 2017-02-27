import {Component, Input, Output, EventEmitter, OnChanges, SimpleChanges} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";
import {IdaiFieldDocument} from "../../model/idai-field-document";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {IdaiFieldPolygon} from "./idai-field-polygon";
import {IdaiFieldMarker} from "./idai-field-marker";
import {IdaiFieldGeometry} from "../../model/idai-field-geometry";
import {MapState} from './map-state';
import {Datastore, Mediastore, Query} from "idai-components-2/datastore";
import {Messages} from "idai-components-2/messages";
import {Document} from "idai-components-2/core";
import {ConfigLoader} from "idai-components-2/configuration";
import {BlobProxy} from "../../common/blob-proxy";
import {ImageContainer} from "../../common/image-container";
import {IdaiFieldImageDocument} from "../../model/idai-field-image-document";
import {FilterUtility} from '../../util/filter-utility';

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

    private bounds: any[]; // in fact L.LatLng[], but leaflet typing are incomplete

    private editablePolygon: L.Polygon;
    private editableMarker: L.Marker;

    private layers: { [id: string]: ImageContainer } = {};
    private activeLayers: Array<ImageContainer> = [];
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
        private sanitizer: DomSanitizer,
        private messages: Messages,
        private configLoader: ConfigLoader
    ) {
        this.blobProxy = new BlobProxy(mediastore, sanitizer);
        this.bounds = [];

    }

    public ngAfterViewInit() {

        if (this.map) {
            this.map.invalidateSize(false);
        }
    }

    public ngOnChanges(changes: SimpleChanges) {

        if (!this.documents) return;

        if (!this.map) {
            this.initializeMap();
        } else {
            this.clearMap();
        }

        let p;
        if (changes['documents']) {
            p = this.initializeLayers().then(
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
        } else {
            p = Promise.resolve();
        }

        for (var i in this.documents) {
            var resource = this.documents[i].resource;
            for (var j in resource.geometries) {
                this.addToMap(resource.geometries[j], this.documents[i]);
            }
        }

        p.then(() => {
            this.map.invalidateSize(true);

            if (this.selectedDocument) {
                if (this.polygons[this.selectedDocument.resource.id]) {
                    this.focusPolygon(this.polygons[this.selectedDocument.resource.id]);
                } else if (this.markers[this.selectedDocument.resource.id]) {
                    this.focusMarker(this.markers[this.selectedDocument.resource.id]);
                }
            } else {
                if (this.bounds.length) this.map.fitBounds(L.latLngBounds(this.bounds));
            }
        });

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

        this.map = L.map("map-container", { crs: L.CRS.Simple, attributionControl: false, minZoom: -1000 });

        var mapComponent = this;
        this.map.on('click', function(event: L.MouseEvent) {
            mapComponent.clickOnMap(event.latlng);
        });

        this.initializeViewport();
        this.initializeViewportMonitoring();
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
            this.mapState.setZoom(this.map.getZoom());;
        }.bind(this));
    }

    private initializeLayers(): Promise<any> {

        return new Promise((resolve, reject) => {

            this.configLoader.getProjectConfiguration().then(projectConfiguration => {

                let query: Query = {
                    q: '',
                    types: FilterUtility.getImageTypesFilterSet(projectConfiguration.getTypesMap())

                };

                this.datastore.find(query).then(
                    documents => {
                        this.makeLayersForDocuments(documents as Document[], resolve);
                    },
                    error => {
                        reject(error);
                    });
            });
        });
    }

    private makeLayersForDocuments(documents: Array<Document>, resolve: any) {

        var zIndex: number = 0;
        var promises: Array<Promise<any>> = [];
        for (var doc of documents) {
            if (doc.resource['georeference']
                && !this.layers[doc.resource.id]
            ) {
                var promise = this.makeLayerForImageResource(doc, zIndex++);
                promises.push(promise);
            }
        }
        Promise.all(promises).then((imgContainers) => {
            for (var imgContainer of imgContainers) {
                this.layers[imgContainer.document.resource.id] = imgContainer;
            }
            resolve();
        });
    }

    private makeLayerForImageResource(document: Document, zIndex: number) {

        return new Promise<any>((resolve,reject)=> {
            var imgContainer : ImageContainer = {
                document: (<IdaiFieldImageDocument>document),
                zIndex: zIndex
            };
            this.blobProxy.getBlobUrl(document.resource['identifier'],true).then(
                url => {
                    imgContainer.imgSrc = url;
                    resolve(imgContainer);
                }
            ).catch(
                msgWithParams => {
                    imgContainer.imgSrc = BlobProxy.blackImg;
                    this.messages.addWithParams(msgWithParams);
                    reject();
                }
            );
        });
    }

    private initializePanes() {

        var layers = this.getLayersAsList();
        for (var i in layers) {
            var id = layers[i].document.resource.id;
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

    private extendBounds(latLng: L.LatLng) {
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

    private addLayerToMap(layer: ImageContainer) {

        let georef = layer.document.resource.georeference;
        layer.object = L.imageOverlay.rotated(layer.imgSrc,
            georef.topLeftCoordinates,
            georef.topRightCoordinates,
            georef.bottomLeftCoordinates,
            { pane: layer.document.resource.id }).addTo(this.map);
        this.extendBounds(L.latLng(georef.topLeftCoordinates));
        this.extendBounds(L.latLng(georef.topRightCoordinates));
        this.extendBounds(L.latLng(georef.bottomLeftCoordinates));

        this.activeLayers.push(layer);
    }

    public toggleLayer(layer: ImageContainer) {

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
            activeLayersIds.push(this.activeLayers[i].document.resource.id);
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

    private getPolygonFromCoordinates(coordinates: Array<any>): L.Polygon {

        var feature = L.polygon(coordinates).toGeoJSON();
        return L.polygon(<any> feature.geometry.coordinates[0]);
    }

    private getLayersAsList(): Array<ImageContainer> {

        var layersList: Array<ImageContainer> = [];

        for (var i in this.layers) {
            if (this.layers.hasOwnProperty(i)) {
                layersList.push(this.layers[i]);
            }
        }

        return layersList.sort((layer1, layer2) => layer1.zIndex - layer2.zIndex);
    }
}



