import {Component, SimpleChanges} from '@angular/core';
import {MapComponent} from 'idai-components-2/idai-field-map';
import {ReadDatastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Document} from 'idai-components-2/core';
import {LayerMapState} from './layer-map-state';
import {Imagestore} from '../../imagestore/imagestore';
import {ImageContainer} from '../../imagestore/image-container';
import {IdaiFieldImageDocument} from '../../model/idai-field-image-document';
import {BlobMaker} from '../../imagestore/blob-maker';

@Component({
    moduleId: module.id,
    selector: 'layer-map',
    templateUrl: './layer-map.html'
})

/**
 * @author Thomas Kleinke
 */
export class LayerMapComponent extends MapComponent {

    public layersList: Array<ImageContainer> = [];
    protected layersMap: { [id: string]: ImageContainer } = {};

    protected activeLayers: Array<ImageContainer> = [];

    protected panes: { [id: string]: any } = {};

    private layersReady: Promise<any>;
    private updateLayers: boolean = false;

    constructor(protected mapState: LayerMapState,
                protected datastore: ReadDatastore,
                protected messages: Messages,
                protected imagestore: Imagestore) {

        super();
    }

    public ngOnChanges(changes: SimpleChanges) {

        if (changes['documents'] && changes['documents'].currentValue) this.updateLayers = true;

        if (!this.update) return;

        if (this.updateLayers) {
            this.updateLayers = false;

            this.layersReady = this.initializeLayers().then(
                () => {
                    this.initializePanes();
                    this.addActiveLayersFromMapState();
                    if (this.activeLayers.length == 0 && this.layersList.length > 0
                        && !this.mapState.getActiveLayersIds()) {
                        this.addLayerToMap(this.layersList[0]);
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

        this.layersReady.then(() => super.setView());
    }

    private initializeLayers(): Promise<any> {

        let query: Query = {
            type: 'image',
            prefix: true
        };

        return this.datastore.find(query)
            .then(documents => this.makeLayersForDocuments(documents as Array<Document>))
            .then(() => {
                this.layersList = this.getLayersAsList(this.layersMap);
            }).catch(msgWithParams => Promise.reject(msgWithParams));
    }

    private makeLayersForDocuments(documents: Array<Document>): Promise<any> {

        let zIndex: number = 0;
        let promises: Array<Promise<ImageContainer>> = [];

        for (var doc of documents) {
            if (doc.resource['georeference'] && !this.layersMap[doc.resource.id]) {
                let promise = this.makeLayerForImageResource(doc, zIndex++);
                promises.push(promise);
            }
        }

        return Promise.all(promises).then(imgContainers => {
            for (let imgContainer of imgContainers) {
                this.layersMap[imgContainer.document.resource.id] = imgContainer;
            }
            return Promise.resolve();
        });
    }

    private makeLayerForImageResource(document: Document, zIndex: number): Promise<ImageContainer> {

        return new Promise<ImageContainer>((resolve, reject) => {
            let imgContainer: ImageContainer = {
                document: (<IdaiFieldImageDocument>document),
                zIndex: zIndex
            };
            this.imagestore.read(document.resource.id, true, false)
                .then(url => {
                    imgContainer.imgSrc = url;
                    resolve(imgContainer);
                }).catch(msgWithParams => {
                    imgContainer.imgSrc = BlobMaker.blackImg;
                    this.messages.add(msgWithParams);
                    reject();
                });
        });
    }

    private initializePanes() {

        for (let layer of this.layersList) {
            var id = layer.document.resource.id;
            if (!this.panes[id]) {
                var pane = this.map.createPane(id);
                pane.style.zIndex = String(layer.zIndex);
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

        this.addLayerCoordinatesToBounds(layer);
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
            let layerId = activeLayersIds[i];
            let layer = this.layersMap[layerId];
            if (!layer) continue;

            if (this.activeLayers.indexOf(layer) == -1) {
                this.addLayerToMap(layer);
            } else {
                this.addLayerCoordinatesToBounds(layer);
            }
        }
    }

    public focusLayer(layer: ImageContainer) {

        let georeference = layer.document.resource.georeference;
        let bounds = [];

        bounds.push(L.latLng(georeference.topLeftCoordinates));
        bounds.push(L.latLng(georeference.topRightCoordinates));
        bounds.push(L.latLng(georeference.bottomLeftCoordinates));

        this.map.fitBounds(bounds);
    }

    private addLayerCoordinatesToBounds(layer: ImageContainer) {

        let georeference = layer.document.resource.georeference;

        this.extendBounds(L.latLng(georeference.topLeftCoordinates));
        this.extendBounds(L.latLng(georeference.topRightCoordinates));
        this.extendBounds(L.latLng(georeference.bottomLeftCoordinates));
    }

    public getLayersAsList(layersMap: { [id: string]: ImageContainer }): Array<ImageContainer> {

        let layersList: Array<ImageContainer> = [];

        for (let i in layersMap) {
            if (layersMap.hasOwnProperty(i)) {
                layersList.push(layersMap[i]);
            }
        }

        return layersList.sort((layer1, layer2) => layer1.zIndex - layer2.zIndex);
    }
}