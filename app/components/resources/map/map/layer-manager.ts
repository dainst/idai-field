import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ImageContainer} from '../../../../core/imagestore/image-container';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {BlobMaker} from '../../../../core/imagestore/blob-maker';
import {ViewFacade} from '../../view/view-facade';

export interface LayersInitializationResult {

    layers: Array<ImageContainer>,
    activeLayersChange: ActiveLayersChange
}

export interface ActiveLayersChange {

    added: Array<ImageContainer>,
    removed: Array<ImageContainer>
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerManager {

    private layersMap: { [id: string]: ImageContainer } = {};
    public activeLayers: Array<ImageContainer> = [];


    constructor(
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private imagestore: Imagestore,
        private imageTypeUtility: ImageTypeUtility,
        private viewFacade: ViewFacade) {}


    /**
     * @returns layers to be removed from the map
     */
    public initializeLayers(mainTypeDocument: IdaiFieldDocument): Promise<LayersInitializationResult> {

        const query: Query = {
            q: '',
            types: this.imageTypeUtility.getProjectImageTypeNames(),
            constraints: { 'resource.georeference': 'KNOWN' }
        };

        return this.datastore.find(query)
            .catch(errWithParams => {
                console.error('error in find with query', query);
                if (errWithParams.length == 2) {
                    console.error('error in find, cause', errWithParams[1]);
                }
                //this.messages.add([M.ALL_FIND_ERROR]);
                Promise.reject(undefined);
            }).then(documents => this.makeLayersForDocuments(documents as Array<IdaiFieldImageDocument>))
            .then(layersMap => {
                this.layersMap = layersMap;
                console.log('layersMap', this.layersMap);
                return {
                    layers: this.getLayersAsList(),
                    activeLayersChange: this.setActiveLayersFromResourcesState(mainTypeDocument)
                };
            });
    }


    public isActiveLayer(layer: ImageContainer): boolean {

        for (let activeLayer of this.activeLayers) {
            if (layer.document.resource.id == activeLayer.document.resource.id) return true;
        }

        return false;
    }


    /**
     * @return true if active layers were added from resources state, otherwise false
     */
    public setActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument): ActiveLayersChange {

        let activeLayerIds: Array<string>;

        if (mainTypeDocument) {
            activeLayerIds = this.viewFacade.getActiveLayersIds(mainTypeDocument.resource.id);
            console.log('ACTIVE LAYERS IDS: ' + JSON.stringify(activeLayerIds));
        }

        return LayerManager.updateLayers(this.activeLayers, activeLayerIds, this.layersMap);
    }


    public saveActiveLayersIdsInResourcesState(mainTypeDocument: IdaiFieldDocument) {

        if (!mainTypeDocument) return;

        const activeLayersIds: Array<string> = [];

        for (let i in this.activeLayers) {
            activeLayersIds.push(this.activeLayers[i].document.resource.id);
        }

        this.viewFacade.setActiveLayersIds(mainTypeDocument.resource.id, activeLayersIds);
    }


    private makeLayersForDocuments(documents: Array<IdaiFieldImageDocument>)
            : Promise<{ [id: string]: ImageContainer }> {

        const layersMap: { [id: string]: ImageContainer } = {};

        let zIndex: number = 0;
        const promises: Array<Promise<ImageContainer>> = [];

        for (let doc of documents) {
            if (this.layersMap[doc.resource.id]) {
                layersMap[doc.resource.id] = this.layersMap[doc.resource.id];
            } else {
                promises.push(this.makeLayerForImageResource(doc, zIndex++));
            }
        }

        return Promise.all(promises).then(imgContainers => {
            for (let imgContainer of imgContainers) {
                layersMap[imgContainer.document.resource.id] = imgContainer;
            }
            return Promise.resolve(layersMap);
        });
    }


    private makeLayerForImageResource(document: IdaiFieldImageDocument, zIndex: number): Promise<ImageContainer> {

        return new Promise<ImageContainer>(resolve => {
            const imgContainer: ImageContainer = {
                document: document,
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
                }, () => {
                    console.error('Error in makeLayerForImageResource: Original image not found in imagestore for ' +
                        'document:', document);
                });
        });
    }


    private getLayersAsList() {

        const layers: Array<ImageContainer> = [];

        for (let i in this.layersMap) {
            if (this.layersMap.hasOwnProperty(i)) layers.push(this.layersMap[i]);
        }

        return layers.sort((layer1, layer2) => layer1.zIndex - layer2.zIndex);
    }


    /**
     * Removes all layers from the given layers array which are not matched by newLayerIds.
     * Adds all layers to the given layers array which are matched by newLayerIds. New layers are taken from the
     * layersMap.
     */
    private static updateLayers(layers: Array<ImageContainer>, newLayerIds: string[],
                                layersMap: { [id: string]: ImageContainer }): ActiveLayersChange {

        return {
            removed: newLayerIds ? LayerManager.reduceLayers(layers, newLayerIds) :
                LayerManager.reduceLayers(layers, []),
            added: newLayerIds ? LayerManager.addLayers(layers, newLayerIds, layersMap) : []
        };
    }


    private static addLayers(layers: Array<ImageContainer>, newLayerIds: string[],
                             layersMap: { [id: string]: ImageContainer }): Array<ImageContainer> {

        const addedLayers: Array<ImageContainer> = [];

        for (let activeLayerId of newLayerIds) {
            const layer = layersMap[activeLayerId];
            if (layers.indexOf(layer) > -1) continue;
            console.log('add layer ' + activeLayerId);
            addedLayers.push(layer);
            layers.push(layer);
        }

        return addedLayers;
    }


    /**
     * Removes layers from layers array which are not matched by newLayerIds
     * @returns the removed layers
     */
    private static reduceLayers(layers: Array<ImageContainer>, newLayerIds: string[]): Array<ImageContainer> {

        const removedLayers: Array<ImageContainer> = [];

        for (let activeLayer of layers) {
            if (newLayerIds.indexOf(activeLayer.document.resource.id) > -1) continue;
            console.log('remove layer ' + activeLayer.document.resource.id);
            removedLayers.push(activeLayer);
        }

        for (let layerToRemove of removedLayers) {
            layers.splice(layers.indexOf(layerToRemove), 1);
        }

        return removedLayers;
    }
}