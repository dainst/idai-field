import {FeatureDocument, Query} from '@idai-field/core';
import {CachedReadDatastore, IdaiFieldFindResult} from '../cached/cached-read-datastore';


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
