import {Query} from 'idai-components-2/datastore';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {CachedReadDatastore, IdaiFieldFindResult} from './core/cached-read-datastore';


export interface IdaiFieldImageDocumentFindResult extends IdaiFieldFindResult<IdaiFieldImageDocument> {}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class IdaiFieldImageDocumentReadDatastore extends CachedReadDatastore<IdaiFieldImageDocument> {

    public async find(query: Query): Promise<IdaiFieldImageDocumentFindResult> {

        return super.find(query);
    }
}