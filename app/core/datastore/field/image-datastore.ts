import {PouchdbDatastore} from '../core/pouchdb-datastore';
import {DocumentCache} from '../core/document-cache';
import {ImageDocument} from 'idai-components-2';
import {TypeConverter} from '../core/type-converter';
import {CachedDatastore} from '../core/cached-datastore';
import {IndexFacade} from "../index/index-facade";

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
        documentConverter: TypeConverter<ImageDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'ImageDocument');
    }
}