import { IndexFacade, PouchdbDatastore, DocumentCache, CategoryConverter, Document } from 'idai-field-core';
import { CachedDatastore } from './cached/cached-datastore';

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
