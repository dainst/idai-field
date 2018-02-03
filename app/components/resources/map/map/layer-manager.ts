import {Injectable} from '@angular/core';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../state/view-facade';
import {addUniqueTo, removeFrom, subtract} from '../../../../util/list-util';


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


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.indexOf(resourceId) > -1;


    public async initializeLayers()
            : Promise<LayersInitializationResult> {

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
            removeFrom(this.activeLayerIds)(resourceId) :
            addUniqueTo(this.activeLayerIds)(resourceId);

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    private async fetchLayers() {

        return (await this.datastore.find({
                q: '',
                types: this.imageTypeUtility.getImageTypeNames(),
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