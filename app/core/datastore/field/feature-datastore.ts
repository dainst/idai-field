import {PouchdbDatastore} from '../core/pouchdb/pouchdb-datastore';
import {DocumentCache} from '../core/cached/document-cache';
import {TypeConverter} from '../core/cached/type-converter';
import {CachedDatastore} from '../core/cached/cached-datastore';
import {IndexFacade} from '../index/index-facade';
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
        indexFacade: IndexFacade,
        documentCache: DocumentCache<FeatureDocument>,
        documentConverter: TypeConverter<FeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FeatureDocument');
    }
}