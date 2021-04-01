import { IndexFacade, CachedDatastore, PouchdbDatastore, DocumentCache, CategoryConverter, Document } from 'idai-field-core';

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
