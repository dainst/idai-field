import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {DocumentConverter} from './core/document-converter';
import {CachedDatastore} from './core/cached-datastore';

/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldDocumentDatastore
    extends CachedDatastore<IdaiFieldDocument> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<IdaiFieldDocument>,
        documentConverter: DocumentConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldDocument');
    }
}