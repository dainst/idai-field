import {FeatureDocument, Query} from 'idai-field-core';
import { CachedDatastore, IdaiFieldFindResult } from '../cached/cached-datastore';


export interface IdaiFieldFeatureDocumentFindResult extends IdaiFieldFindResult<FeatureDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FeatureReadDatastore extends CachedDatastore<FeatureDocument> {

    public async find(query: Query): Promise<IdaiFieldFeatureDocumentFindResult> {

        return super.find(query);
    }
}
