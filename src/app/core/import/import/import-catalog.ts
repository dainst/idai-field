import {Document, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {clone} from '../../util/object-util';
import {ImportFunction} from './types';
import {makeDocumentsLookup} from './utils';


export interface ImportCatalogServices {

    datastore: DocumentDatastore
}


export function buildImportCatalogFunction(services: ImportCatalogServices, {username, selectedProject}): ImportFunction {

    /**
     * @param importDocuments
     * @param datastore
     * @param settings
     *
     * @author Daniel de Oliveira
     */
    return async function importCatalog(importDocuments: Array<Document>)
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            const existingDocuments = makeDocumentsLookup(
                await services.datastore.getMultiple(importDocuments.map(toResourceId)));

            let successfulImports = 0;
            for (let importDocument of importDocuments) {
                delete importDocument[Document._REV];
                delete importDocument[Document.MODIFIED];
                delete importDocument[Document.CREATED];

                const existingDocument: Document | undefined = await existingDocuments[importDocument.resource.id];
                const updateDocument = clone(existingDocument ?? importDocument);

                if (importDocument.project === selectedProject) delete updateDocument.project;

                if (existingDocument) {
                    const oldRelations = clone(existingDocument.resource.relations);
                    updateDocument.resource = clone(importDocument.resource);
                    updateDocument.resource.relations = oldRelations;
                    await services.datastore.update(updateDocument, username);
                } else {
                    await services.datastore.create(updateDocument, username);
                }
                successfulImports++;
            }
            return {errors: [], successfulImports: successfulImports};

        } catch (errWithParams) {
            return {errors: [errWithParams], successfulImports: 0};
        }
    }
}
