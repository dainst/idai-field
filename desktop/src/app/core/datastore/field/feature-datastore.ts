import { DocumentDatastore, IdaiFieldFindResult, FeatureDocument, IndexFacade, PouchdbDatastore, Query, CategoryConverter, DocumentCache } from 'idai-field-core';


export interface IdaiFieldFeatureDocumentFindResult extends IdaiFieldFindResult<FeatureDocument> {}

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FeatureDatastore
    extends DocumentDatastore<FeatureDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<FeatureDocument>,
                documentConverter: CategoryConverter<FeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter);
    }

    public async find(query: Query): Promise<IdaiFieldFeatureDocumentFindResult> {

        return super.find(query);
    }
}
