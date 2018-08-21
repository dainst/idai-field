import {Injectable} from '@angular/core';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/field/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';
import {unique, subtract} from 'tsfun';


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
        private viewFacade: ViewFacade) {}


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);


    public async initializeLayers(skipRemoval = false)
    : Promise<LayersInitializationResult> {

        if (!skipRemoval) await this.removeNonExistingLayers();

        const activeLayersChange = LayerManager.computeActiveLayersChange(
            this.viewFacade.getActiveLayersIds(),
            this.activeLayerIds);

        this.activeLayerIds = this.viewFacade.getActiveLayersIds();

        try {
            return {
                layers: await this.fetchLayers(),
                activeLayersChange: activeLayersChange
            };
        } catch(e) {
            console.error('error with datastore.find', e);
            throw undefined;
        }
    }


    public toggleLayer(resourceId: string) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            subtract([resourceId])(this.activeLayerIds) :
            unique(this.activeLayerIds.concat([resourceId]));

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    private async removeNonExistingLayers() {

        const newActiveLayersIds = this.viewFacade.getActiveLayersIds();

        let i = newActiveLayersIds.length;
        while (i--) {
            try {
                await this.datastore.get(newActiveLayersIds[i])
            } catch (_) {
                newActiveLayersIds.splice(i, 1);
                this.viewFacade.setActiveLayersIds(newActiveLayersIds);
            }
        }
    }


    private async fetchLayers() {

        return (await this.datastore.find({
            constraints: { 'georeference:exist': 'KNOWN' }
        })).documents;
    }


    private static computeActiveLayersChange(
        newActiveLayerIds: Array<string>,
        oldActiveLayerIds: Array<string>): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}