import {Document} from 'idai-components-2/core';
import {CachedDatastore} from './core/cached-datastore';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class DocumentDatastore
    extends CachedDatastore<Document> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<Document>,
        documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'Document');
    }
}