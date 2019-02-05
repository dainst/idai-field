import {Query} from 'idai-components-2';
import {FieldDocument} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../core/cached-read-datastore';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class FieldReadDatastore extends CachedReadDatastore<FieldDocument> {

    public async find(query: Query): Promise<FieldDocumentFindResult> {

        return super.find(query);
    }
}