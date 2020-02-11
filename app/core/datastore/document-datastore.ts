import {Document} from 'idai-components-2';
import {CachedDatastore} from './cached/cached-datastore';
import {PouchdbDatastore} from './pouchdb/pouchdb-datastore';
import {DocumentCache} from './cached/document-cache';
import {TypeConverter} from './cached/type-converter';
import {Index} from './index/index';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class DocumentDatastore extends CachedDatastore<Document> {

    constructor(datastore: PouchdbDatastore,
        indexFacade: Index,
        documentCache: DocumentCache<Document>,
        documentConverter: TypeConverter<Document>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'Document');
    }
}