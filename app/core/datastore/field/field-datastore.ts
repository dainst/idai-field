import {FieldDocument} from 'idai-components-2';
import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from '../cached/document-cache';
import {TypeConverter} from '../cached/type-converter';
import {CachedDatastore} from '../cached/cached-datastore';
import {Index} from '../index';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class FieldDatastore extends CachedDatastore<FieldDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: Index,
        documentCache: DocumentCache<FieldDocument>,
        documentConverter: TypeConverter<FieldDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FieldDocument');
    }
}