import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from '../cached/document-cache';
import {TypeConverter} from '../cached/type-converter';
import {CachedDatastore} from '../cached/cached-datastore';
import {Index} from '../index';
import {FeatureDocument} from 'idai-components-2';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class FeatureDatastore
    extends CachedDatastore<FeatureDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: Index,
        documentCache: DocumentCache<FeatureDocument>,
        documentConverter: TypeConverter<FeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FeatureDocument');
    }
}