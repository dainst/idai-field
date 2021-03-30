import { FieldDocument, IndexFacade, PouchdbDatastore } from 'idai-field-core';
import { CachedDatastore } from '../cached/cached-datastore';
import { CategoryConverter } from '../cached/category-converter';
import { DocumentCache } from '../cached/document-cache';

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
}
