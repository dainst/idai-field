import {PouchdbDatastore} from '../core/pouchdb-datastore';
import {DocumentCache} from '../core/document-cache';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {TypeConverter} from '../core/type-converter';
import {CachedDatastore} from '../core/cached-datastore';
import {IndexFacade} from "../index/index-facade";

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class IdaiFieldImageDocumentDatastore
    extends CachedDatastore<IdaiFieldImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<IdaiFieldImageDocument>,
        documentConverter: TypeConverter<IdaiFieldImageDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'IdaiFieldImageDocument');
    }
}