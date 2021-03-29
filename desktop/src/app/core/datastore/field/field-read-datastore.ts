import {FieldDocument, Query} from '@idai-field/core';
import {CachedReadDatastore, IdaiFieldFindResult} from '../cached/cached-read-datastore';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FieldReadDatastore extends CachedReadDatastore<FieldDocument> {

    public async find(query: Query, ignoreTypes: boolean = false): Promise<FieldDocumentFindResult> {

        return super.find(query, ignoreTypes);
    }
}
