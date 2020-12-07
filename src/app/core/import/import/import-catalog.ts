import {Document, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {clone} from '../../util/object-util';
import {ImportFunction} from './types';
import {makeDocumentsLookup} from './utils';
import {RelationsManager} from '../../model/relations-manager';


export interface ImportCatalogServices {

    datastore: DocumentDatastore,
    relationsManager: RelationsManager
}


export interface ImportCatalogContext {

    username: string;
    selectedProject: string;
}


export function buildImportCatalogFunction(services: ImportCatalogServices,
                                           context: ImportCatalogContext): ImportFunction {

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
            const typeCatalogDocument = importDocuments.filter(_ => _.resource.category === 'TypeCatalog')[0]; // TODO handle errors

            const existingDocuments = makeDocumentsLookup(
                await services.relationsManager.get(typeCatalogDocument.resource.id));

            let successfulImports = 0;
            for (let importDocument of importDocuments) {
                delete importDocument[Document._REV];
                delete importDocument[Document.MODIFIED];
                delete importDocument[Document.CREATED];

                const existingDocument: Document | undefined = await existingDocuments[importDocument.resource.id];
                const updateDocument = clone(existingDocument ?? importDocument);

                if (importDocument.project === context.selectedProject) delete updateDocument.project;

                if (existingDocument) {
                    const oldRelations = clone(existingDocument.resource.relations);
                    updateDocument.resource = clone(importDocument.resource);
                    updateDocument.resource.relations = oldRelations;
                    await services.datastore.update(updateDocument, context.username);
                } else {
                    await services.datastore.create(updateDocument, context.username);
                }
                successfulImports++;
            }
            return {errors: [], successfulImports: successfulImports};

        } catch (errWithParams) {
            return {errors: [errWithParams], successfulImports: 0};
        }
    }
}
