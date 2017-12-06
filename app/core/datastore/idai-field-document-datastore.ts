import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';

/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldDocumentDatastore
    extends CachedDatastore<IdaiFieldDocument> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<IdaiFieldDocument>,
        documentConverter: TypeConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldDocument');
    }
}