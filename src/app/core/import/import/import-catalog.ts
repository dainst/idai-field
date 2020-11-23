import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {DatastoreErrors} from '../../datastore/model/datastore-errors';
import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {clone} from '../../util/object-util';
import {isNot, undefinedOrEmpty} from 'tsfun';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


export function makeImportCatalog(datastore: DocumentDatastore, {username, selectedProject, imagestorePath}) {

    /**
     * @param importDocuments
     * @param datastore
     * @param settings
     *
     * @author Daniel de Oliveira
     */
    return async function importCatalog(importDocuments: Array<Document>,
                                        )
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            let successfulImports = 0;
            for (let importDocument of importDocuments) {
                delete importDocument[Document._REV];
                delete importDocument[Document.MODIFIED];
                delete importDocument[Document.CREATED];

                const existingDocument: Document | undefined = await getDocument(datastore, importDocument.resource.id);
                const updateDocument = clone(existingDocument ?? importDocument);

                if (importDocument.project === selectedProject) delete updateDocument.project;

                if (existingDocument) {
                    await datastore.update(updateDocument, username);
                } else {
                    await datastore.create(updateDocument, username);
                }

                // TODO extract function
                if (isImageDocument(updateDocument)) {
                    const source =
                        '' // TODO how to get the import path?
                        + updateDocument.resource.id;

                    const target = imagestorePath
                        + selectedProject // TODO or should we take document.project?
                        + '/' // TODO operating system
                        + updateDocument.resource.id;

                    // console.log("copy image", source, target);
                    // fs.copyFileSync(source, target);
                }

                successfulImports++;
            }
            return {errors: [], successfulImports: successfulImports};

        } catch (errWithParams) {
            return {errors: [errWithParams], successfulImports: 0};
        }
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


const isImageDocument = (updateDocument: Document) =>
    isNot(undefinedOrEmpty)(updateDocument.resource.relations['depicts'])
