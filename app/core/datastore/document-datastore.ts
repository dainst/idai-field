import {Document} from 'idai-components-2';
import {CachedDatastore} from './cached/cached-datastore';
import {PouchdbDatastore} from './pouchdb/pouchdb-datastore';
import {DocumentCache} from './cached/document-cache';
import {TypeConverter} from './cached/type-converter';
import {IndexFacade} from './index/index-facade';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class DocumentDatastore extends CachedDatastore<Document> {

    constructor(datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<Document>,
        documentConverter: TypeConverter<Document>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'Document');
    }
}