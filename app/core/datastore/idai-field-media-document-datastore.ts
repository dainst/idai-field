import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';


/**
 * @author Thomas Kleinke
 */
export class IdaiFieldMediaDocumentDatastore
    extends CachedDatastore<IdaiFieldImageDocument|IdaiField3DDocument> {

    constructor(datastore: PouchdbDatastore,
                documentCache: DocumentCache<IdaiFieldImageDocument|IdaiField3DDocument>,
                documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldMediaDocument');
    }
}