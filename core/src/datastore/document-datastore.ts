import { IndexFacade } from '../index/index-facade';
import { Document } from '../model/document';
import { CachedDatastore } from './cached/cached-datastore';
import { CategoryConverter } from './cached/category-converter';
import { DocumentCache } from './cached/document-cache';
import { PouchdbDatastore } from './pouchdb/pouchdb-datastore';


/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class DocumentDatastore extends CachedDatastore<Document> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<Document>,
                documentConverter: CategoryConverter<Document>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'Document');
    }
}
