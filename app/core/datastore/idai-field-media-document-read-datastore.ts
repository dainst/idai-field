import {Query} from 'idai-components-2/datastore';
import {CachedReadDatastore, IdaiFieldFindResult} from './core/cached-read-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';


export interface IdaiFieldMediaDocumentFindResult
    extends IdaiFieldFindResult<IdaiFieldImageDocument|IdaiField3DDocument> {}


/**
 * @author Thomas Kleinke
 */
export abstract class IdaiFieldMediaDocumentReadDatastore
    extends CachedReadDatastore<IdaiFieldImageDocument|IdaiField3DDocument> {

    public async find(query: Query): Promise<IdaiFieldMediaDocumentFindResult> {

        return super.find(query);
    }
}