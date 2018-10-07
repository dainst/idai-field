import {Injectable} from '@angular/core';
import {subtract} from 'tsfun';
import {ViewFacade} from '../../../../view/view-facade';
import {LayerManager, ListDiffResult} from '../../../layer-manager';
import {LayersInitializationResult} from '../../../layer-manager';
import {IdaiField3DDocument} from '../../../../../../core/model/idai-field-3d-document';
import {IdaiField3DDocumentReadDatastore} from '../../../../../../core/datastore/idai-field-3d-document-read-datastore';


// TODO Move more methods to LayerManager

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class Layer3DManager extends LayerManager<IdaiField3DDocument> {

    constructor(private datastore: IdaiField3DDocumentReadDatastore,
                viewFacade: ViewFacade) {

        super(viewFacade);
    }


    public async initializeLayers(skipRemoval: boolean = false)
            : Promise<LayersInitializationResult<IdaiField3DDocument>> {

        if (!skipRemoval) await this.removeNonExistingLayers();

        const activeLayersChange = Layer3DManager.computeActiveLayersChange(
            this.viewFacade.getActive3DLayersIds(),
            this.activeLayerIds);

        this.activeLayerIds = this.viewFacade.getActive3DLayersIds();

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

        const newActiveLayersIds = this.viewFacade.getActive3DLayersIds();

        let i = newActiveLayersIds.length;
        while (i--) {
            try {
                await this.datastore.get(newActiveLayersIds[i])
            } catch (_) {
                newActiveLayersIds.splice(i, 1);
                this.viewFacade.setActive3DLayersIds(newActiveLayersIds);
            }
        }
    }


    private async fetchLayers() {

        return (await this.datastore.find({
            q: '',
            types: ['Model3D'],
            constraints: { 'georeferenced:exist': 'KNOWN' }
        })).documents;
    }


    protected saveActiveLayerIds() {

        this.viewFacade.setActive3DLayersIds(this.activeLayerIds);
    }


    private static computeActiveLayersChange(newActiveLayerIds: Array<string>,
                                             oldActiveLayerIds: Array<string>): ListDiffResult {

        return {
            removed: subtract(newActiveLayerIds)(oldActiveLayerIds),
            added: subtract(oldActiveLayerIds)(newActiveLayerIds)
        };
    }
}
