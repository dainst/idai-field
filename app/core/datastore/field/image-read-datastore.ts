import {Query} from 'idai-components-2';
import {ImageDocument} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../core/cached-read-datastore';


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