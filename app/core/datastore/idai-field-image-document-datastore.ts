import {PouchdbDatastore} from "./core/pouchdb-datastore";
import {DocumentCache} from "./core/document-cache";
import {IdaiFieldImageDocument} from "../model/idai-field-image-document";
import {DocumentConverter} from "./core/document-converter";
import {DocumentDatastore} from "./document-datastore";
import {CachedDatastore} from "./core/cached-datastore";

/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldImageDocumentDatastore
    extends CachedDatastore<IdaiFieldImageDocument> {

    constructor(
        datastore: PouchdbDatastore,
        documentCache: DocumentCache<IdaiFieldImageDocument>,
        documentConverter: DocumentConverter) {

        super(datastore, documentCache, documentConverter, 'IdaiFieldImageDocument');
    }

    // TODO intercept and handle every call that tries to access or modify non image documents

    // TODO make that query is only for image document types. throw exception if tried otherwise
    // TODO throw error if constraints except identifier are used
    public find(query: any): Promise<IdaiFieldImageDocument[]> {

        return super.find(query).then(result => {

            return result;
        })
    }
}