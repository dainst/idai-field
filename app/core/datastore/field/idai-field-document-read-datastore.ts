import {Query} from 'idai-components-2';
import {IdaiFieldDocument} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../core/cached-read-datastore';


export interface IdaiFieldDocumentFindResult extends IdaiFieldFindResult<IdaiFieldDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class IdaiFieldDocumentReadDatastore extends CachedReadDatastore<IdaiFieldDocument> {

    public async find(query: Query): Promise<IdaiFieldDocumentFindResult> {

        return super.find(query);
    }
}