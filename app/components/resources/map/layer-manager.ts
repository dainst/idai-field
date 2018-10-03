import {Injectable} from '@angular/core';
import {subtract, unique} from 'tsfun';
import {Document, IdaiFieldDocument} from 'idai-components-2';
import {ViewFacade} from '../view/view-facade';


export interface LayersInitializationResult<T> {

    layers: Array<T>,
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
export abstract class LayerManager<T extends Document> {

    protected activeLayerIds: Array<string> = [];


    constructor(protected viewFacade: ViewFacade) {}


    public abstract async initializeLayers(skipRemoval?: boolean): Promise<LayersInitializationResult<T>>;


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);


    public toggleLayer(resourceId: string) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            subtract([resourceId])(this.activeLayerIds) :
            unique(this.activeLayerIds.concat([resourceId]));

        this.saveActiveLayerIds();
    }


    protected abstract saveActiveLayerIds(): void;
}