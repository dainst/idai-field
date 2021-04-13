import { DocumentDatastore, IdaiFieldFindResult, ImageDocument, IndexFacade, PouchdbDatastore, Query, DocumentCache, CategoryConverter } from 'idai-field-core';

export interface IdaiFieldImageDocumentFindResult extends IdaiFieldFindResult<ImageDocument> {}

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImageDatastore
    extends DocumentDatastore<ImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<ImageDocument>,
        documentConverter: CategoryConverter<ImageDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter);
    }


    public async find(query: Query): Promise<IdaiFieldImageDocumentFindResult> {

        return super.find(query);
    }
}
