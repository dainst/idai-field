import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../state/view-facade';
import {add, remove, subtract} from "../../../../util/list-util";


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


    public async initializeLayers(mainTypeDocument: IdaiFieldDocument | undefined)
            : Promise<LayersInitializationResult> {

        try {
            return {
                layers: (await this.datastore.find({
                    q: '',
                    types: this.imageTypeUtility.getImageTypeNames(),
                    constraints: { 'georeference:exist': 'KNOWN' }
                })).documents,
                activeLayersChange: this.fetchActiveLayersFromResourcesState(mainTypeDocument)
            };
        } catch(e) {
            console.error('error with datastore.find', e);
        }

        return Promise.reject(undefined);
    }


    public reset = () => this.activeLayerIds = [];


    public isActiveLayer = (resourceId: string) => this.activeLayerIds.indexOf(resourceId) > -1;


    public toggleLayer(resourceId: string, mainTypeDocument: IdaiFieldDocument | undefined) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            remove(this.activeLayerIds, resourceId) :
            add(this.activeLayerIds, resourceId);

        if (mainTypeDocument) this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    private fetchActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument | undefined): ListDiffResult {

        const newActiveLayerIds = mainTypeDocument ?
            this.viewFacade.getActiveLayersIds() : [];
        const oldActiveLayerIds = this.activeLayerIds.slice(0);
        this.activeLayerIds = newActiveLayerIds;

        return {
            removed: subtract(oldActiveLayerIds, newActiveLayerIds),
            added: subtract(newActiveLayerIds, oldActiveLayerIds),
        };
    }
}