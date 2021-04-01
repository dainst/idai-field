import { IdaiFieldFindResult, FieldDocument, IndexFacade, CachedDatastore, PouchdbDatastore, Query, CategoryConverter, DocumentCache } from 'idai-field-core';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class FieldDatastore extends CachedDatastore<FieldDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<FieldDocument>,
                documentConverter: CategoryConverter<FieldDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FieldDocument');
    }


    public async find(query: Query, ignoreTypes: boolean = false): Promise<FieldDocumentFindResult> {

        return super.find(query, ignoreTypes);
    }
}
