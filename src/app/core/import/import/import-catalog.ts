import {isArray, isNot, isUndefinedOrEmpty, on, set, subtract, to, undefinedOrEmpty} from 'tsfun';
import {map as asyncMap} from 'tsfun/async';
import {Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {clone} from '../../util/object-util';
import {ImportFunction} from './types';
import {makeDocumentsLookup} from './utils';
import {RelationsManager} from '../../model/relations-manager';
import {RESOURCE_ID_PATH} from '../../constants';
import {HierarchicalRelations, ImageRelations, TypeRelations} from '../../model/relation-constants';
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

    export const CONNECTED_TYPE_DELETED = 'ImportCatalogErrors.connectedTypeDeleted';
    export const DIFFERENT_PROJECT_ENTRIES = 'ImportCatalogErrors.differentProjectEntries';
    export const NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS = 'ImportCatalogErrors.noOrTooManyTypeCatalogDocuments';
    export const INVALID_RELATIONS = 'ImportCatalogErrors.invalidRelations';
}


export function buildImportCatalogFunction(services: ImportCatalogServices,
                                           context: ImportCatalogContext): ImportFunction {

    /**
     * @param importDocumentsKatalogimport abgebrochen. Ungültige Relationen.
     * @param datastore
     * @param settings
     *
     * @author Daniel de Oliveira
     */
    return async function importCatalog(importDocuments: Array<Document>)
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            assertProjectAlwaysTheSame(importDocuments);
            const [existingDocuments, existingDocumentsRelatedImages] =
                await getExistingCatalogDocuments(services, importDocuments);

            assertRelationsValid(importDocuments);
            assertNoDeletionOfRelatedTypes(Object.values(existingDocuments), importDocuments);

            const updateDocuments = await asyncMap(importDocuments,
                importOneDocument(services.datastore, context, existingDocuments));

            await removeRelatedImages(
                services, updateDocuments, existingDocumentsRelatedImages);
            await removeObsoleteCatalogDocuments(
                services, Object.values(existingDocuments), updateDocuments);
            return { errors: [], successfulImports: updateDocuments.length };

        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
        }
    }
}


function assertRelationsValid(documents: Array<Document>) {

    const lookup = makeDocumentsLookup(documents);

    for (const document of documents) {
        if (document.resource.category === 'TypeCatalog') {
            if (isNot(undefinedOrEmpty)(document.resource.relations[HierarchicalRelations.LIESWITHIN])
                || isNot(undefinedOrEmpty)(document.resource.relations[ImageRelations.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }
        if (document.resource.category === 'Type' ) {
            if (!isArray(document.resource.relations[HierarchicalRelations.LIESWITHIN])
                || document.resource.relations[HierarchicalRelations.LIESWITHIN].length !== 1) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            const target = lookup[document.resource.relations[HierarchicalRelations.LIESWITHIN][0]];
            if (target === undefined
                || (target.resource.category !== 'Type' && target.resource.category !== 'TypeCatalog')) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }
        if (document.resource.category === 'Type' || document.resource.category === 'TypeCatalog') {
            if (!isUndefinedOrEmpty(document.resource.relations[ImageRelations.ISDEPICTEDIN])) {
                for (const target_ of document.resource.relations[ImageRelations.ISDEPICTEDIN]) {
                    const target = lookup[target_];
                    if (target === undefined
                        || !target.resource.relations[ImageRelations.DEPICTS].includes(document.resource.id)) {
                        throw [ImportCatalogErrors.INVALID_RELATIONS];
                    }
                }
            }
        }
        if (document.resource.category !== 'TypeCatalog' && document.resource.category !== 'Type') {
            if (isUndefinedOrEmpty(document.resource.relations[ImageRelations.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            } else {
                for (const target_ of document.resource.relations[ImageRelations.DEPICTS]) {
                    const target = lookup[target_];
                    if (target === undefined
                        || !target.resource.relations[ImageRelations.ISDEPICTEDIN].includes(document.resource.id)) {
                        throw [ImportCatalogErrors.INVALID_RELATIONS];
                    }
                }
            }
            for (const target_ of document.resource.relations[HierarchicalRelations.LIESWITHIN]) {
                const target = lookup[target_];
                if (target === undefined
                    || (target.resource.category !== 'Type' && target.resource.category !== 'TypeCatalog')) {
                    throw [ImportCatalogErrors.INVALID_RELATIONS];
                }
            }
        }
    }
}


function assertProjectAlwaysTheSame(documents: Array<Document>) {

    if (documents.length < 2) return;
    if (set(documents.map(to(Document.PROJECT))).length > 1) {
        throw [ImportCatalogErrors.DIFFERENT_PROJECT_ENTRIES];
    }
}


async function removeObsoleteCatalogDocuments(services: ImportCatalogServices,
                                              existingDocuments: Array<Document>,
                                              updateDocuments: Array<Document>) {

    const diff = subtract(on(RESOURCE_ID_PATH), updateDocuments)(existingDocuments);
    for (const d of diff) {
        await services.datastore.remove(d);
    }
}


async function removeRelatedImages(services: ImportCatalogServices,
                                   updateDocuments: Array<Document>,
                                   existingDocumentsRelatedImages: Array<Document>) {

    const updateDocumentRelatedImages =
        await services.imageRelationsManager.getLinkedImages(updateDocuments);
    const diffImages = subtract(on(RESOURCE_ID_PATH), updateDocumentRelatedImages)(existingDocumentsRelatedImages);
    for (const diff of diffImages) {
        // TODO make sure it was connected to only this catalog, and not maybe to some other catalog from the same original user, for example
        await services.imagestore.remove(diff.resource.id);
    }
}


function assertNoDeletionOfRelatedTypes(existingDocuments: Array<Document>,
                                              importDocuments: Array<Document>) {

    const removedDocuments = subtract(on(RESOURCE_ID_PATH), importDocuments)(existingDocuments);
    const problems = [];
    for (const removedDocument of removedDocuments) {
        if (isNot(undefinedOrEmpty)(removedDocument.resource.relations[TypeRelations.HASINSTANCE])) {
            problems.push(removedDocument.resource.identifier);
        }
    }
    if (problems.length > 0 ) throw [
        ImportCatalogErrors.CONNECTED_TYPE_DELETED,
        problems.join(',')];
}


async function getExistingCatalogDocuments(services: ImportCatalogServices,
                                           importDocuments: Array<Document>): Promise<[Lookup<Document>, Array<Document>]> {

    const typeCatalogDocuments =
        importDocuments.filter(_ => _.resource.category === 'TypeCatalog');
    if (typeCatalogDocuments.length !== 1) throw [ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS];
    const typeCatalogDocument = typeCatalogDocuments[0];

    const existingDocuments = makeDocumentsLookup(
        await services.relationsManager.get(typeCatalogDocument.resource.id, { descendants: true }));
    return [
        existingDocuments,
        await services.imageRelationsManager.getLinkedImages(Object.values(existingDocuments))
    ];
}


function importOneDocument(datastore: DocumentDatastore,
                           context: ImportCatalogContext,
                           existingDocuments: Lookup<Document>) {

    return async function(document: Document) {

        delete document[Document._REV];
        delete document[Document.MODIFIED];
        delete document[Document.CREATED];

        const existingDocument: Document | undefined = await existingDocuments[document.resource.id];
        const updateDocument = clone(existingDocument ?? document);

        if (document.project === context.selectedProject) delete updateDocument.project;

        if (existingDocument) {
            const oldRelations = clone(existingDocument.resource.relations[TypeRelations.HASINSTANCE]);
            updateDocument.resource = clone(document.resource);
            updateDocument.resource.relations[TypeRelations.HASINSTANCE] = oldRelations;
            await datastore.update(updateDocument, context.username);
        } else {
            await datastore.create(updateDocument, context.username);
        }

        return updateDocument;
    }
}
