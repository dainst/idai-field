import {IdaiFieldDocument} from 'idai-components-2';
import {PouchdbDatastore} from '../core/pouchdb-datastore';
import {DocumentCache} from '../core/document-cache';
import {TypeConverter} from '../core/type-converter';
import {CachedDatastore} from '../core/cached-datastore';
import {IndexFacade} from "../index/index-facade";

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class IdaiFieldDocumentDatastore
    extends CachedDatastore<IdaiFieldDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<IdaiFieldDocument>,
        documentConverter: TypeConverter<IdaiFieldDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'IdaiFieldDocument');
    }
}