import { IndexFacade, PouchdbDatastore } from '@idai-field/core';
import { Document } from 'idai-components-2';
import { CachedDatastore } from './cached/cached-datastore';
import { CategoryConverter } from './cached/category-converter';
import { DocumentCache } from './cached/document-cache';

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
