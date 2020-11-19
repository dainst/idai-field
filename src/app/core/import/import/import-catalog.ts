import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {DatastoreErrors} from '../../datastore/model/datastore-errors';
import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {clone} from '../../util/object-util';


// TODO batch import for speed
/**
 * @param importDocuments
 * @param datastore
 * @param username
 *
 * @param selectedProject
 * @author Daniel de Oliveira
 */
export async function importCatalog(importDocuments: Array<Document>,
                                    datastore: DocumentDatastore,
                                    username: string,
                                    selectedProject: string): Promise<{ errors: string[][], successfulImports: number }> {

    try {
        let successfulImports = 0;
        for (let importDocument of importDocuments) {
            delete importDocument[Document._REV];
            delete importDocument[Document.MODIFIED];
            delete importDocument[Document.CREATED];

            const existingDocument: Document|undefined = await getDocument(datastore, importDocument.resource.id);
            const updateDocument = clone(existingDocument ?? importDocument);

            if (importDocument.project === selectedProject) delete updateDocument.project;

            if (existingDocument) {
                await datastore.update(updateDocument, username);
            } else {
                await datastore.create(updateDocument, username);
            }
            successfulImports++;
        }
        return { errors: [], successfulImports: successfulImports };

    } catch (errWithParams) {
        return { errors: [errWithParams], successfulImports: 0 };
    }
}



// TODO make reusable
async function getDocument(datastore: DocumentReadDatastore, resourceId: string): Promise<Document> {

    try {
        return await datastore.get(resourceId)
    } catch (errWithParams) {
        if (errWithParams.length === 1
            && errWithParams[0] === DatastoreErrors.DOCUMENT_NOT_FOUND) return undefined;
        else throw errWithParams;
    }
}
