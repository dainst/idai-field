import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';


/**
 * @author Thomas Kleinke
 */
export class IdaiField3DDocumentDatastore extends CachedDatastore<IdaiField3DDocument> {

    constructor(datastore: PouchdbDatastore,
                documentCache: DocumentCache<IdaiField3DDocument>,
                documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiField3DDocument');
    }
}