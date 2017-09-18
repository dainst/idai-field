import {Component, SimpleChanges} from '@angular/core';
import {MapComponent} from 'idai-components-2/idai-field-map';
import {ReadDatastore, Query} from 'idai-components-2/datastore';
import {Messages} from 'idai-components-2/messages';
import {Document} from 'idai-components-2/core';
import {ConfigLoader} from 'idai-components-2/configuration';
import {Imagestore} from '../../imagestore/imagestore';
import {ImageContainer} from '../../imagestore/image-container';
import {IdaiFieldImageDocument} from '../../model/idai-field-image-document';
import {BlobMaker} from '../../imagestore/blob-maker';
import {ImageTypeUtility} from '../../util/image-type-utility';
import {ResourcesState} from '../resources-state';
import {ResourcesComponent} from '../resources.component';
import {M} from '../../m';

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

    private layersUpdate: boolean = false;

    constructor(protected datastore: ReadDatastore,
                protected messages: Messages,
                protected imagestore: Imagestore,
                private imageTypeUtility: ImageTypeUtility,
                private resourcesState: ResourcesState,
                private resourcesComponent: ResourcesComponent,
                configLoader: ConfigLoader) {

        super(configLoader);
    }

    protected updateMap(changes: SimpleChanges): Promise<any> {

        if (changes['documents'] && changes['documents'].currentValue) this.layersUpdate = true;

        if (!this.update) return Promise.resolve();

        return super.updateMap(changes);
    }

    protected setView(): Promise<any> {

        let promise: Promise<any>;
        if (this.layersUpdate) {
            this.layersUpdate = false;
            promise = this.updateLayers();
        } else {
            promise = Promise.resolve();
        }

        return promise.then(() => {
            for (let layer of this.activeLayers) {
                this.addLayerCoordinatesToBounds(layer);
            }
            super.setView();
        });
    }

    private updateLayers(): Promise<any> {

        return this.initializeLayers()
            .then(() => {
                this.initializePanes();
                if (!this.setActiveLayersFromResourcesState() && this.activeLayers.length == 0
                        && this.layersList.length > 0) {
                    this.addLayerToMap(this.layersList[0]);
                    this.saveActiveLayersIdsInResourcesState();
                }
            });
    }

    private initializeLayers(): Promise<any> {

        const query: Query = { q: '' };

        return this.imageTypeUtility.getProjectImageTypeNames().then(imageTypeNames => {
            query.types = imageTypeNames;
            return this.datastore.find(query);
        }).catch(errWithParams => {
            console.error('error in find with query', query);
            if (errWithParams.length == 2) {
                console.error('error in find, cause', errWithParams[1]);
            }
            this.messages.add([M.ALL_FIND_ERROR]);
            Promise.reject(undefined);
        }).then(documents => this.makeLayersForDocuments(documents as Array<Document>))
        .then(layersMap => {
            this.removeOldLayersFromMap(layersMap);
            this.layersMap = layersMap;
            this.layersList = this.getLayersAsList(layersMap);
        });
    }

    private makeLayersForDocuments(documents: Array<Document>): Promise<{ [id: string]: ImageContainer }> {

        let layersMap: { [id: string]: ImageContainer } = {};

        let zIndex: number = 0;
        let promises: Array<Promise<ImageContainer>> = [];

        for (let doc of documents) {
            if (doc.resource['georeference']) {
                if (this.layersMap[doc.resource.id]) {
                    layersMap[doc.resource.id] = this.layersMap[doc.resource.id];
                } else {
                    let promise = this.makeLayerForImageResource(doc, zIndex++);
                    promises.push(promise);
                }
            }
        }

        return Promise.all(promises).then(imgContainers => {
            for (let imgContainer of imgContainers) {
                layersMap[imgContainer.document.resource.id] = imgContainer;
            }
            return Promise.resolve(layersMap);
        });
    }

    private makeLayerForImageResource(document: Document, zIndex: number): Promise<ImageContainer> {

        return new Promise<ImageContainer>(resolve => {
            const imgContainer: ImageContainer = {
                document: (<IdaiFieldImageDocument>document),
                zIndex: zIndex
            };

            this.imagestore.read(document.resource.id, true, false)
                .then(url => {
                    if (url != '') {
                        imgContainer.imgSrc = url;
                        resolve(imgContainer);
                    } else {
                        this.imagestore.read(document.resource.id, true, true).then(thumbnailUrl => {
                            imgContainer.imgSrc = thumbnailUrl;
                            resolve(imgContainer);
                        }).catch(() => {
                            imgContainer.imgSrc = BlobMaker.blackImg;
                            resolve(imgContainer);
                        });
                    }
                });
        });
    }

    private removeOldLayersFromMap(newLayersMap: { [id: string]: ImageContainer }) {

        for (let layer of this.getLayersAsList(this.layersMap)) {
            if (!newLayersMap[layer.document.resource.id] && this.isActiveLayer(layer)) {
                this.map.removeLayer(layer.object);
            }
        }
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
        layer.object = L.imageOverlay(layer.imgSrc,
            [georef.topLeftCoordinates,
            georef.topRightCoordinates,
            georef.bottomLeftCoordinates],
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

        this.saveActiveLayersIdsInResourcesState();
    }

    public isActiveLayer(layer: ImageContainer): boolean {

        for (let activeLayer of this.activeLayers) {
            if (layer.document.resource.id == activeLayer.document.resource.id) return true;
        }

        return false;
    }

    private saveActiveLayersIdsInResourcesState() {

        if (!this.mainTypeDocument) return;

        var activeLayersIds: Array<string> = [];

        for (var i in this.activeLayers) {
            activeLayersIds.push(this.activeLayers[i].document.resource.id);
        }

        this.resourcesState.setActiveLayersIds(this.resourcesComponent.view.name, this.mainTypeDocument.resource.id,
            activeLayersIds);
    }

    /**
     * @return true if active layers were added from resources state, otherwise false
     */
    private setActiveLayersFromResourcesState(): boolean {

        var activeLayersIds: Array<string>;

        if (this.mainTypeDocument) {
            activeLayersIds = this.resourcesState.getActiveLayersIds(this.resourcesComponent.view.name,
                this.mainTypeDocument.resource.id);
        }

        if (!activeLayersIds) {
            this.removeLayersFromActiveLayers([]);
            return false;
        }

        this.removeLayersFromActiveLayers(activeLayersIds);

        for (var i in activeLayersIds) {
            let layerId = activeLayersIds[i];
            let layer = this.layersMap[layerId];
            if (!layer) continue;

            if (!this.isActiveLayer(layer)) this.addLayerToMap(layer);
        }

        return true;
    }

    private removeLayersFromActiveLayers(newActiveLayerIds: string[]) {

        let activeLayersToRemove: Array<ImageContainer> = [];
        for (let activeLayer of this.activeLayers) {
            if (newActiveLayerIds.indexOf(activeLayer.document.resource.id) == -1) {
                activeLayersToRemove.push(activeLayer);
            }
        }

        for (let layerToRemove of activeLayersToRemove) {
            this.activeLayers.splice(this.activeLayers.indexOf(layerToRemove), 1);
            this.map.removeLayer(layerToRemove.object);
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

    public getLayerLabel(layer: ImageContainer): string {

        let label: string;

        if (layer.document.resource.shortDescription && layer.document.resource.shortDescription != '') {
            label = layer.document.resource.shortDescription;
        } else {
            label = layer.document.resource.identifier;
        }

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}
