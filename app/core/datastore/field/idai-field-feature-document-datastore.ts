import {PouchdbDatastore} from '../core/pouchdb-datastore';
import {DocumentCache} from '../core/document-cache';
import {TypeConverter} from '../core/type-converter';
import {CachedDatastore} from '../core/cached-datastore';
import {IndexFacade} from '../index/index-facade';
import {IdaiFieldFeatureDocument} from '../../model/idai-field-feature-document';

/**
 * Data Access Object
 *
 * @author Daniel de Oliveira
 */
export class IdaiFieldFeatureDocumentDatastore
    extends CachedDatastore<IdaiFieldFeatureDocument> {

    constructor(
        datastore: PouchdbDatastore,
        indexFacade: IndexFacade,
        documentCache: DocumentCache<IdaiFieldFeatureDocument>,
        documentConverter: TypeConverter<IdaiFieldFeatureDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'IdaiFieldFeatureDocument');
    }
}