import {Query} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../core/cached-read-datastore';
import {FeatureDocument} from 'idai-components-2';


export interface IdaiFieldFeatureDocumentFindResult extends IdaiFieldFindResult<FeatureDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FeatureReadDatastore extends CachedReadDatastore<FeatureDocument> {

    public async find(query: Query): Promise<IdaiFieldFeatureDocumentFindResult> {

        return super.find(query);
    }
}