import {Injectable} from '@angular/core';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/field/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';
import {subtract, unique} from 'tsfun';
import {TypeUtility} from '../../../../core/model/type-utility';
import {ObserverUtil} from '../../../../util/observer-util';
import {Observer} from 'rxjs/Observer';
import {Observable} from 'rxjs/Observable'


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

    private layerIdsObservers: Array<Observer<LayersInitializationResult>> = [];
    public layerIdsNotifications = (): Observable<LayersInitializationResult> => ObserverUtil.register(this.layerIdsObservers);

    private activeLayerIds: Array<string> = [];

    constructor(
        private datastore: IdaiFieldImageDocumentReadDatastore,
        private viewFacade: ViewFacade) {


        viewFacade.layerIdsNotifications().subscribe(async (activeLayersIds, skipRemoval = false) => {

            const activeLayersChange = LayerManager.computeActiveLayersChange(
                activeLayersIds,
                this.activeLayerIds);

            this.activeLayerIds = activeLayersIds;

            // TODO see if we notify them only if there are neither removals nor additions
            this.notifyLayerIdsObservers(await this.initializeLayers(activeLayersChange, skipRemoval));
        });
    }


    public reset = () => this.activeLayerIds = [];

    public isActiveLayer = (resourceId: string) => this.activeLayerIds.includes(resourceId);


    public toggleLayer(resourceId: string) {

        this.activeLayerIds = this.isActiveLayer(resourceId) ?
            subtract([resourceId])(this.activeLayerIds) :
            unique(this.activeLayerIds.concat([resourceId]));

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    private async removeNonExistingLayers() {

        const newActiveLayersIds = this.activeLayerIds;

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


    private async initializeLayers(activeLayersChange: any, skipRemoval: boolean)
        : Promise<LayersInitializationResult> {

        if (!skipRemoval) await this.removeNonExistingLayers();

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


    private async fetchLayers() {

        return (await this.datastore.find({
                q: '',
                constraints: { 'georeference:exist': 'KNOWN' }
            })).documents;
    }


    private notifyLayerIdsObservers(layerInitializationResult: LayersInitializationResult) {

        ObserverUtil.notify(this.layerIdsObservers, layerInitializationResult);
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