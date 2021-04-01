import {FieldDocument, Query} from 'idai-field-core';
import { CachedDatastore, IdaiFieldFindResult } from '../cached/cached-datastore';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FieldReadDatastore extends CachedDatastore<FieldDocument> {

    public async find(query: Query, ignoreTypes: boolean = false): Promise<FieldDocumentFindResult> {

        return super.find(query, ignoreTypes);
    }
}
