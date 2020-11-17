import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {update} from 'tsfun';
import {DatastoreErrors} from '../../datastore/model/datastore-errors';


// TODO batch import for speed
/**
 * @param documents
 * @param datastore
 * @param username
 *
 * @author Daniel de Oliveira
 */
export async function importCatalog(documents: Array<Document>,
                                    datastore: DocumentDatastore,
                                    username: string): Promise<{ errors: string[][], successfulImports: number }> {

    let successfulImports = 0;
    for (let document of documents) {
        delete document[Document._REV];
        delete document['modified'];
        delete document['created'];

        try {
            const existingDocument: Document = await datastore.get(document.resource.id);
            const updateDocument = update(Document.RESOURCE, document.resource, existingDocument);
            await datastore.update(updateDocument, username);
        } catch ([err]) {
            if (err === DatastoreErrors.DOCUMENT_NOT_FOUND) {
                document['readonly'] = true; // TODO let app react to that, for example by prohibiting editing
                await datastore.create(document, username);
            } else {
                // TODO what about the already imported ones?
                return { errors: [[DatastoreErrors.DOCUMENT_NOT_FOUND]], successfulImports: successfulImports }
            }
        }

        successfulImports++;
    }

    return { errors: [], successfulImports: successfulImports };
}
