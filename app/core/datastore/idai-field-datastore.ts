import {Document} from 'idai-components-2/core';
import {CachedDatastore} from "./core/cached-datastore";
import {IdaiFieldReadDatastore} from "./idai-field-read-datastore";
import {PouchdbDatastore} from "./core/pouchdb-datastore";
import {DocumentCache} from "./core/document-cache";
import {DocumentConverter} from "./core/document-converter";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';

/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldDatastore
    extends CachedDatastore<Document>
    implements IdaiFieldReadDatastore {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<Document>,
        documentConverter: DocumentConverter) {

        super(datastore, documentCache, documentConverter, 'Document / idai-field');
    }

    // TODO make that query is only for image document types. throw exception if tried otherwise
    // TODO make that if trying to use unknown constraints leads to an exception
    public find(query: any): Promise<Document[]> {

        return super.find(query).then(result => {

            return result;
        })
    }
}