import {Document} from 'idai-components-2/core';
import {FindResult} from 'idai-components-2/datastore';
import {CachedDatastore} from './core/cached-datastore';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from './core/document-cache';
import {TypeConverter} from './core/type-converter';

/**
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

    // TODO make that query is only for image document types. throw exception if tried otherwise
    // TODO make that if trying to use unknown constraints leads to an exception
    public find(query: any): Promise<FindResult> {

        return super.find(query).then(result => {

            return result;
        })
    }
}