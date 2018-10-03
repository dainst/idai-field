import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';
import {CachedDatastore} from './core/cached-datastore';
import {IdaiField3DDocument} from '../model/idai-field-3d-document';
import {IndexFacade} from './index/index-facade';


/**
 * @author Thomas Kleinke
 */
export class IdaiField3DDocumentDatastore extends CachedDatastore<IdaiField3DDocument> {

    constructor(datastore: PouchdbDatastore,
                indexFacade: IndexFacade,
                documentCache: DocumentCache<IdaiField3DDocument>,
                documentConverter: TypeConverter<IdaiField3DDocument>) {

        super(datastore, indexFacade, documentCache, documentConverter, 'IdaiField3DDocument');
    }
}