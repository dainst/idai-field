import { IdaiFieldFindResult, FieldDocument, IndexFacade, DocumentDatastore, PouchdbDatastore, Query, CategoryConverter, DocumentCache } from 'idai-field-core';


export interface FieldDocumentFindResult extends IdaiFieldFindResult<FieldDocument> {}

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class FieldDatastore extends DocumentDatastore<FieldDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<FieldDocument>,
                documentConverter: CategoryConverter<FieldDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter);
    }


    public async find(query: Query, ignoreTypes: boolean = false): Promise<FieldDocumentFindResult> {

        return super.find(query, ignoreTypes);
    }
}
