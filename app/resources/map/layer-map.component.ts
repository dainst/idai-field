import {Component, SimpleChanges} from '@angular/core';
import {MapComponent} from './map.component';
import {Imagestore} from '../../imagestore/imagestore';
import {ImageContainer} from '../../imagestore/image-container';
import {IdaiFieldImageDocument} from '../../model/idai-field-image-document';
import {BlobMaker} from '../../imagestore/blob-maker';
import {MapState} from './map-state';
import {Datastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Document} from 'idai-components-2/core';

@Component({
    moduleId: module.id,
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})

/**
 * @author Thomas Kleinke
 */
export class LayerMapComponent extends MapComponent {

    protected layers: { [id: string]: ImageContainer } = {};
    protected activeLayers: Array<ImageContainer> = [];
    protected panes: { [id: string]: any } = {};

    private layersReady: Promise<any>;

    constructor(mapState: MapState,
                datastore: Datastore,
                messages: Messages,
                protected imagestore: Imagestore) {

        super(mapState, datastore, messages);
    }

    public ngOnChanges(changes: SimpleChanges) {

        if (changes['documents']) {
            this.layersReady = this.initializeLayers().then(
                () => {
                    this.initializePanes();
                    this.addActiveLayersFromMapState();
                    var layers = this.getLayersAsList();
                    if (this.activeLayers.length == 0 && layers.length > 0 && !this.mapState.getActiveLayersIds()) {
                        this.addLayerToMap(layers[0]);
                        this.saveActiveLayersIdsInMapState();
                    }
                }
            );
        } else {
            this.layersReady = Promise.resolve();
        }

        super.ngOnChanges(changes);
    }

    protected setView() {

        this.layersReady.then(() => {
            super.setView();
        });
    }

    private initializeLayers(): Promise<any> {

        return new Promise((resolve, reject) => {

            let query: Query = {
                q: '',
                type: 'image',
                prefix: true
            };

            this.datastore.find(query).then(
                documents => {
                    this.makeLayersForDocuments(documents as Document[], resolve);
                },
                error => {
                    reject(error);
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

        return new Promise<any>((resolve, reject)=> {
            var imgContainer : ImageContainer = {
                document: (<IdaiFieldImageDocument>document),
                zIndex: zIndex
            };
            this.imagestore.read(document.resource['identifier'], true, false).then(
                url => {
                    imgContainer.imgSrc = url;
                    resolve(imgContainer);
                }
            ).catch(
                msgWithParams => {
                    imgContainer.imgSrc = BlobMaker.blackImg;
                    this.messages.add(msgWithParams);
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

    public isActiveLayer(layer: ImageContainer) {

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

    public focusLayer(layer: ImageContainer) {

        let georef = layer.document.resource.georeference;
        let bounds = [];

        bounds.push(L.latLng(georef.topLeftCoordinates));
        bounds.push(L.latLng(georef.topRightCoordinates));
        bounds.push(L.latLng(georef.bottomLeftCoordinates));

        this.map.fitBounds(bounds);
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