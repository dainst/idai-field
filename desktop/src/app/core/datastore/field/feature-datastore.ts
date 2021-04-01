import { FeatureDocument, IndexFacade, PouchdbDatastore, Query, CategoryConverter, DocumentCache } from 'idai-field-core';
import { CachedDatastore, IdaiFieldFindResult } from '../cached/cached-datastore';


export interface IdaiFieldFeatureDocumentFindResult extends IdaiFieldFindResult<FeatureDocument> {}

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FeatureDatastore
    extends CachedDatastore<FeatureDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<FeatureDocument>,
                documentConverter: CategoryConverter<FeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FeatureDocument');
    }

    public async find(query: Query): Promise<IdaiFieldFeatureDocumentFindResult> {

        return super.find(query);
    }
}
