import {ImageDocument, Query} from 'idai-field-core';
import {CachedReadDatastore, IdaiFieldFindResult} from '../cached/cached-read-datastore';


export interface IdaiFieldImageDocumentFindResult extends IdaiFieldFindResult<ImageDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class ImageReadDatastore extends CachedReadDatastore<ImageDocument> {

    public async find(query: Query): Promise<IdaiFieldImageDocumentFindResult> {

        return super.find(query);
    }
}
