import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';
import {IdaiFieldMediaDocument} from '../model/idai-field-media-document';
import {IndexFacade} from './index/index-facade';


/**
 * @author Thomas Kleinke
 */
export class IdaiFieldMediaDocumentDatastore
    extends CachedDatastore<IdaiFieldMediaDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<IdaiFieldMediaDocument>,
                documentConverter: TypeConverter<IdaiFieldMediaDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'IdaiFieldMediaDocument');
    }
}