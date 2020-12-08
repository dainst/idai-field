import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {clone} from '../../util/object-util';
import {ImportFunction} from './types';
import {makeDocumentsLookup} from './utils';
import {RelationsManager} from '../../model/relations-manager';
import {RESOURCE_ID_PATH} from '../../constants';
import {isNot, on, subtract, undefinedOrEmpty} from 'tsfun';
import {TypeRelations} from '../../model/relation-constants';
import {ImageRelationsManager} from '../../model/image-relations-manager';
import {Lookup} from '../../util/utils';
import {Imagestore} from '../../images/imagestore/imagestore';


export interface ImportCatalogServices {

    datastore: DocumentDatastore;
    relationsManager: RelationsManager;
    imageRelationsManager: ImageRelationsManager;
    imagestore: Imagestore
}


export interface ImportCatalogContext {

    username: string;
    selectedProject: string;
}


export module ImportCatalogErrors {

    export const CONNECTED_TYPE_DELETED = 'importCatalogErrors/connectedTypeDeleted'; // TODO convert later for UI
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
            const [existingDocuments, existingDocumentsRelatedImages] =
                await getExistingCatalogDocuments(services, importDocuments);

            const removedDocuments = subtract(on(RESOURCE_ID_PATH), importDocuments)(Object.values(existingDocuments)); // TODO review subtract, params, object.values
            for (const removedDocument of removedDocuments) {
                if (isNot(undefinedOrEmpty)(removedDocument.resource.relations[TypeRelations.HASINSTANCE])) {
                    return {
                        errors: [[ImportCatalogErrors.CONNECTED_TYPE_DELETED]], // TODO add ids of documents
                        successfulImports: 0
                    }
                }
            }
            // TODO delete difference, including images, if not connected

            let successfulImports = 0;
            const updateDocuments = [];
            for (let importDocument of importDocuments) {
                const updateDocument =
                    await importOneDocument(services.datastore, context, existingDocuments, importDocument);
                updateDocuments.push(updateDocument);
                successfulImports++;
            }

            const updateDocumentRelatedImages =
                await services.imageRelationsManager.getRelatedImageDocuments(updateDocuments);
            const diffImages = subtract(on(RESOURCE_ID_PATH), updateDocumentRelatedImages)(existingDocumentsRelatedImages);
            for (const diff of diffImages) {
                // TODO make sure it was connected to only this catalog, and not maybe to some other catalog from the same original user, for example
                await services.imagestore.remove(diff.resource.id);
            }

            return { errors: [], successfulImports: successfulImports };

        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
        }
    }
}


async function getExistingCatalogDocuments(services: ImportCatalogServices,
                                           importDocuments: Array<Document>): Promise<[Lookup<Document>, Array<Document>]> {

    const typeCatalogDocument =
        importDocuments.filter(_ => _.resource.category === 'TypeCatalog')[0]; // TODO handle errors
    const existingDocuments = makeDocumentsLookup(
        await services.relationsManager.get(typeCatalogDocument.resource.id));
    return [
        existingDocuments,
        await services.imageRelationsManager.getRelatedImageDocuments(Object.values(existingDocuments))
    ];
}


async function importOneDocument(datastore: DocumentDatastore,
                                 context: ImportCatalogContext,
                                 existingDocuments: Lookup<Document>,
                                 importDocument: Document) {

    delete importDocument[Document._REV];
    delete importDocument[Document.MODIFIED];
    delete importDocument[Document.CREATED];

    const existingDocument: Document | undefined = await existingDocuments[importDocument.resource.id];
    const updateDocument = clone(existingDocument ?? importDocument);

    if (importDocument.project === context.selectedProject) delete updateDocument.project;

    if (existingDocument) {
        const oldRelations = clone(existingDocument.resource.relations[TypeRelations.HASINSTANCE]);
        updateDocument.resource = clone(importDocument.resource);
        updateDocument.resource.relations[TypeRelations.HASINSTANCE] = oldRelations;
        await datastore.update(updateDocument, context.username);
    } else {
        await datastore.create(updateDocument, context.username);
    }

    return updateDocument;
}
