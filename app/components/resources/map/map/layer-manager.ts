import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';
import {IdDiffResult, IdDiffTool} from './id-diff-tool';


export interface LayersInitializationResult {

    layers: Array<IdaiFieldImageDocument>,
    activeLayersChange: IdDiffResult
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


    public reset() {

        this.layers = [];
        this.activeLayerIds = [];
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
    private setActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument): IdDiffResult {

        let newActiveLayerIds: Array<string>;

        if (mainTypeDocument) { // TODO why not throw if !mainTypeDocument?
            newActiveLayerIds = this.viewFacade.getActiveLayersIds(mainTypeDocument.resource.id);
            if (!newActiveLayerIds) newActiveLayerIds = []; // TODO make that we get that from viewFacade instead of undefined

            const result = IdDiffTool.transduce(this.activeLayerIds, newActiveLayerIds);
            this.activeLayerIds = newActiveLayerIds;
            return result;
        }
    }


    private saveActiveLayersIdsInResourcesState(mainTypeDocument: IdaiFieldDocument) {

        if (!mainTypeDocument) return;

        this.viewFacade.setActiveLayersIds(mainTypeDocument.resource.id, this.activeLayerIds);
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