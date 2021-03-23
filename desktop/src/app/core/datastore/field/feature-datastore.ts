import {PouchdbDatastore} from '../pouchdb/pouchdb-datastore';
import {DocumentCache} from '../cached/document-cache';
import {CategoryConverter} from '../cached/category-converter';
import {CachedDatastore} from '../cached/cached-datastore';
import {IndexFacade} from '../index/index-facade';
import { FeatureDocument } from '@idai-field/core';


/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class FeatureDatastore
    extends CachedDatastore<FeatureDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<FeatureDocument>,
                documentConverter: CategoryConverter<FeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'FeatureDocument');
    }
}
