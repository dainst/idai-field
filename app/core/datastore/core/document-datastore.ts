import {CachedDatastore} from "./cached-datastore";
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from "./pouchdb-datastore";
import {DocumentCache} from "./document-cache";
import {DocumentConverter} from "./document-converter";

/**
 * @author Daniel de Oliveira
 */
export class DocumentDatastore extends CachedDatastore<Document> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<Document>,
        documentConverter: DocumentConverter) {

        super(datastore, documentCache, documentConverter, 'Document / components');
    }


    // TODO make that if trying to use unknown constraints leads to an exception
    public find(query: any): Promise<Document[]> {

        return super.find(query).then(result => {
            return result;
        })
    }
}