import {Query} from 'idai-components-2/datastore';
import {CachedReadDatastore, IdaiFieldFindResult} from './core/cached-read-datastore';
import {IdaiFieldMediaDocument} from '../model/idai-field-media-document';


export interface IdaiFieldMediaDocumentFindResult extends IdaiFieldFindResult<IdaiFieldMediaDocument> {}


/**
 * @author Thomas Kleinke
 */
export abstract class IdaiFieldMediaDocumentReadDatastore
        extends CachedReadDatastore<IdaiFieldMediaDocument> {

    public async find(query: Query): Promise<IdaiFieldMediaDocumentFindResult> {

        return super.find(query);
    }
}