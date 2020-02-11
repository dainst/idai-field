import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from '../cached/document-cache';
import {ImageDocument} from 'idai-components-2';
import {TypeConverter} from '../cached/type-converter';
import {CachedDatastore} from '../cached/cached-datastore';
import {Index} from "../index";

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class ImageDatastore
    extends CachedDatastore<ImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: Index,
        documentCache: DocumentCache<ImageDocument>,
        documentConverter: TypeConverter<ImageDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'ImageDocument');
    }
}