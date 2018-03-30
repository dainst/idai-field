import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';
import {IdaiFieldMediaDocument} from '../model/idai-field-media-document';


/**
 * @author Thomas Kleinke
 */
export class IdaiFieldMediaDocumentDatastore
    extends CachedDatastore<IdaiFieldMediaDocument> {

    constructor(datastore: PouchdbDatastore,
                documentCache: DocumentCache<IdaiFieldMediaDocument>,
                documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldMediaDocument');
    }
}