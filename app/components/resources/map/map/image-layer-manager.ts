import {Injectable} from '@angular/core';
import {subtract} from 'tsfun';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {ImageReadDatastore} from '../../../../core/datastore/field/image-read-datastore';
import {ViewFacade} from '../../view/view-facade';
import {LayerManager, LayersInitializationResult, ListDiffResult} from '../layer-manager';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageLayerManager extends LayerManager<IdaiFieldImageDocument> {

    constructor(private datastore: ImageReadDatastore,
                viewFacade: ViewFacade) {

        super(viewFacade);
    }


    public async initializeLayers(skipRemoval: boolean = false)
            : Promise<LayersInitializationResult<IdaiFieldImageDocument>> {

        if (!skipRemoval) await this.removeNonExistingLayers();

        const activeLayersChange = ImageLayerManager.computeActiveLayersChange(
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


    protected saveActiveLayerIds() {

        this.viewFacade.setActiveLayersIds(this.activeLayerIds);
    }


    private static computeActiveLayersChange(newActiveLayerIds: string[],
                                             oldActiveLayerIds: string[]): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}