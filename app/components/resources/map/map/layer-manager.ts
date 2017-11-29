import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';

export interface LayersInitializationResult {

    layers: Array<IdaiFieldImageDocument>,
    activeLayersChange: ActiveLayersChange
}

export interface ActiveLayersChange {

    added: Array<string>,
    removed: Array<string>
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerManager {

    private layers: Array<IdaiFieldImageDocument> = [];
    private activeLayerIds: Array<string> = [];


    constructor(
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private imageTypeUtility: ImageTypeUtility,
        private viewFacade: ViewFacade) {}


    /**
     * @returns layers to be removed from the map
     */
    public async initializeLayers(mainTypeDocument: IdaiFieldDocument): Promise<LayersInitializationResult> {

        const query: Query = {
            q: '',
            types: this.imageTypeUtility.getProjectImageTypeNames(),
            constraints: { 'resource.georeference': 'KNOWN' }
        };

        // TODO Error handling
        this.layers = await this.datastore.find(query);

        return {
            layers: this.layers,
            activeLayersChange: this.setActiveLayersFromResourcesState(mainTypeDocument)
        };
    }


    public isActiveLayer(resourceId: string): boolean {

        return this.activeLayerIds.indexOf(resourceId) > -1;
    }


    /**
     * @returns true if the layer has been activated, false if the layer has been deactivated
     */
    public toggleLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument): boolean {

        if (this.isActiveLayer(resourceId)) {
            this.deactivateLayer(resourceId, mainTypeDocument);
            return false;
        } else {
            this.activateLayer(resourceId, mainTypeDocument);
            return true;
        }
    }


    /**
     * @return true if active layers were added from resources state, otherwise false
     */
    private setActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument): ActiveLayersChange {

        let newActiveLayerIds: Array<string>;

        if (mainTypeDocument) {
            newActiveLayerIds = this.viewFacade.getActiveLayersIds(mainTypeDocument.resource.id);
        }

        return LayerManager.updateLayers(this.activeLayerIds, newActiveLayerIds);
    }


    private saveActiveLayersIdsInResourcesState(mainTypeDocument: IdaiFieldDocument) {

        if (!mainTypeDocument) return;

        this.viewFacade.setActiveLayersIds(mainTypeDocument.resource.id, this.activeLayerIds);
    }


    /**
     * Removes all layers from the given layers array which are not matched by newLayerIds.
     * Adds all layers to the given layers array which are matched by newLayerIds. New layers are taken from the
     * layersMap.
     */
    private static updateLayers(layerIds: string[], newLayerIds: string[]): ActiveLayersChange {

        return {
            removed: newLayerIds ? LayerManager.reduceLayers(layerIds, newLayerIds) :
                LayerManager.reduceLayers(layerIds, []),
            added: newLayerIds ? LayerManager.addLayers(layerIds, newLayerIds) : []
        };
    }


    private static addLayers(layerIds: string[], newLayerIds: string[]): Array<string> {

        const addedLayerIds: string[] = [];

        for (let layerId of newLayerIds) {
            if (layerIds.indexOf(layerId) > -1) continue;
            addedLayerIds.push(layerId);
            layerIds.push(layerId);
        }

        return addedLayerIds;
    }


    /**
     * Removes layers from layers array which are not matched by newLayerIds
     * @returns the removed layers
     */
    private static reduceLayers(layerIds: string[], newLayerIds: string[]): Array<string> {

        const removedLayerIds: string[] = [];

        for (let layerId of layerIds) {
            if (newLayerIds.indexOf(layerId) > -1) continue;
            removedLayerIds.push(layerId);
        }

        for (let layerToRemove of removedLayerIds) {
            layerIds.splice(layerIds.indexOf(layerToRemove), 1);
        }

        return removedLayerIds;
    }


    private activateLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument) {

        if (this.activeLayerIds.indexOf(resourceId) > -1) return;

        this.activeLayerIds.push(resourceId);
        this.saveActiveLayersIdsInResourcesState(mainTypeDocument);
    }


    private deactivateLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument) {

        const index: number = this.activeLayerIds.indexOf(resourceId);
        if (index == -1) return;

        this.activeLayerIds.splice(index, 1);
        this.saveActiveLayersIdsInResourcesState(mainTypeDocument);
    }
}