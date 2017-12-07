import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class IdaiFieldImageDocumentDatastore
    extends CachedDatastore<IdaiFieldImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<IdaiFieldImageDocument>,
        documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldImageDocument');
    }
}