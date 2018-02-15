import {Injectable} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ImageTypeUtility} from '../../../../common/image-type-utility';
import {IdaiFieldImageDocumentReadDatastore} from '../../../../core/datastore/idai-field-image-document-read-datastore';
import {ViewFacade} from '../../view/view-facade';
import {ListUtil} from '../../../../util/list-util';
import {LayerManager, LayersInitializationResult, ListDiffResult} from '../layer-manager';
import {IdaiFieldImageDocument} from '../../../../core/model/idai-field-image-document';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class ImageLayerManager extends LayerManager<IdaiFieldImageDocument> {

    constructor(private datastore: IdaiFieldImageDocumentReadDatastore,
                private imageTypeUtility: ImageTypeUtility,
                viewFacade: ViewFacade) {

        super(viewFacade);
    }


    public async initializeLayers(mainTypeDocument: IdaiFieldDocument | undefined)
            : Promise<LayersInitializationResult<IdaiFieldImageDocument>> {

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


    private fetchActiveLayersFromResourcesState(mainTypeDocument: IdaiFieldDocument | undefined)
            : ListDiffResult {

        const newActiveLayerIds = mainTypeDocument ?
            this.viewFacade.getActiveLayersIds(mainTypeDocument.resource.id as any) : [];
        const oldActiveLayerIds = this.activeLayerIds.slice(0);
        this.activeLayerIds = newActiveLayerIds;

        return {
            removed: ListUtil.subtract(oldActiveLayerIds, newActiveLayerIds),
            added: ListUtil.subtract(newActiveLayerIds, oldActiveLayerIds)
        };
    }


    protected saveActiveLayerIds(mainTypeDocument: IdaiFieldDocument) {

        this.viewFacade.setActiveLayersIds(mainTypeDocument.resource.id as any,
            this.activeLayerIds);
    }
}