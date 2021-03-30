import { ImageDocument, IndexFacade, PouchdbDatastore } from 'idai-field-core';
import { CachedDatastore } from '../cached/cached-datastore';
import { CategoryConverter } from '../cached/category-converter';
import { DocumentCache } from '../cached/document-cache';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class ImageDatastore
    extends CachedDatastore<ImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<ImageDocument>,
        documentConverter: CategoryConverter<ImageDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'ImageDocument');
    }
}
