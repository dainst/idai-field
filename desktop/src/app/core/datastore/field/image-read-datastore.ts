import {ImageDocument, Query} from 'idai-field-core';
import { CachedDatastore, IdaiFieldFindResult } from '../cached/cached-datastore';


export interface IdaiFieldImageDocumentFindResult extends IdaiFieldFindResult<ImageDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class ImageReadDatastore extends CachedDatastore<ImageDocument> {

    public async find(query: Query): Promise<IdaiFieldImageDocumentFindResult> {

        return super.find(query);
    }
}
