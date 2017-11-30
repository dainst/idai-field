import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';


export interface LayersInitializationResult {

    layers: Array<IdaiFieldImageDocument>,
    activeLayersChange: ListDiffResult
}

export interface ListDiffResult {

    added: Array<string>,
    removed: Array<string>
}


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LayerManager {

    private activeLayerIds: Array<string> = [];

    constructor(
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private imageTypeUtility: ImageTypeUtility,
        private viewFacade: ViewFacade) {}


    public async initializeLayers(mainTypeDocument: IdaiFieldDocument): Promise<LayersInitializationResult> {

        try {
            return {
                layers: await this.datastore.find({
                    q: '',
                    types: this.imageTypeUtility.getProjectImageTypeNames(),
                    constraints: { 'resource.georeference': 'KNOWN' }
                }),
                activeLayersChange: this.setActiveLayersFromResourcesState(mainTypeDocument)
            };
        } catch (e) {
            console.error("error with datastore.find",e);
        }
    }


    public reset() {

        this.activeLayerIds = [];
    }


    public isActiveLayer(resourceId: string): boolean {

        return this.activeLayerIds.indexOf(resourceId) > -1;
    }


    /**
     * @returns true if the layer has been activated, false if the layer has been deactivated
     */
    public toggleLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument): boolean {

        if (!mainTypeDocument) throw 'mainTypeDocument must not be undefined';

        if (this.isActiveLayer(resourceId)) {
            this.deactivateLayer(resourceId, mainTypeDocument);
            return false;
        } else {
            this.activateLayer(resourceId, mainTypeDocument);
            return true;
        }
    }


    private setActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument): ListDiffResult {

        const newActiveLayerIds = this.viewFacade.getActiveLayersIds(mainTypeDocument.resource.id);
        const oldActiveLayerIds = this.activeLayerIds.slice(0);
        this.activeLayerIds = newActiveLayerIds;

        return {
            removed: oldActiveLayerIds.filter(item => newActiveLayerIds.indexOf(item) === -1),
            added: newActiveLayerIds.filter(item => oldActiveLayerIds.indexOf(item) === -1),
        };
    }


    private saveActiveLayersIdsInResourcesState(mainTypeDocument: IdaiFieldDocument) {

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