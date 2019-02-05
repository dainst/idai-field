import {Injectable} from '@angular/core';
import {unique, subtract} from 'tsfun';
import {ImageDocument} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../core/datastore/field/image-read-datastore';
import {ViewFacade} from '../../view/view-facade';


export interface LayersInitializationResult {

    layers: Array<ImageDocument>,
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

    private activeLayerIds: string[] = [];


    constructor(private datastore: ImageReadDatastore,
                private viewFacade: ViewFacade) {}


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);


    public async initializeLayers(skipRemoval: boolean = false): Promise<LayersInitializationResult> {

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


    private static computeActiveLayersChange(newActiveLayerIds: string[],
                                             oldActiveLayerIds: string[]): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}