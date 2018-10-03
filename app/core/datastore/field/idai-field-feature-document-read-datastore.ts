import {Query} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../core/cached-read-datastore';
import {IdaiFieldFeatureDocument} from 'idai-components-2';


export interface IdaiFieldFeatureDocumentFindResult extends IdaiFieldFindResult<IdaiFieldFeatureDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class IdaiFieldFeatureDocumentReadDatastore extends CachedReadDatastore<IdaiFieldFeatureDocument> {

    public async find(query: Query): Promise<IdaiFieldFeatureDocumentFindResult> {

        return super.find(query);
    }
}