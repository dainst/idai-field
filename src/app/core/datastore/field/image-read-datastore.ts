import {ImageDocument} from 'idai-components-2';
import {CachedReadDatastore, IdaiFieldFindResult} from '../cached/cached-read-datastore';
import {Query} from '../model/query';


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
