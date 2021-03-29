import {ImageDocument, IndexFacade} from '@idai-field/core';
import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from '../cached/document-cache';
import {CategoryConverter} from '../cached/category-converter';
import {CachedDatastore} from '../cached/cached-datastore';

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
