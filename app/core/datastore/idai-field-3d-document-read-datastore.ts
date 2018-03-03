import {Query} from 'idai-components-2/datastore';
import {CachedReadDatastore, IdaiFieldFindResult} from './core/cached-read-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';


export interface IdaiField3DDocumentFindResult extends IdaiFieldFindResult<IdaiField3DDocument> {}


/**
 * @author Thomas Kleinke
 */
export abstract class IdaiField3DDocumentReadDatastore extends CachedReadDatastore<IdaiField3DDocument> {

    public async find(query: Query): Promise<IdaiField3DDocumentFindResult> {

        return super.find(query);
    }
}