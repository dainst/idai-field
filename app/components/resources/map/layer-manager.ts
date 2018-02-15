import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ViewFacade} from '../view/view-facade';
import {ListUtil} from '../../../util/list-util';


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


    public abstract async initializeLayers(mainTypeDocument: IdaiFieldDocument | undefined)
            : Promise<LayersInitializationResult<T>>;


    public reset() {

        this.activeLayerIds = [];
    }


    public isActiveLayer(resourceId: string): boolean {

        return this.activeLayerIds.indexOf(resourceId) > -1;
    }


    public toggleLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument | undefined) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            ListUtil.remove(this.activeLayerIds, resourceId) :
            ListUtil.add(this.activeLayerIds, resourceId);

        if (mainTypeDocument) this.saveActiveLayerIds(mainTypeDocument);
    }


    protected abstract saveActiveLayerIds(mainTypeDocument: IdaiFieldDocument): void;
}