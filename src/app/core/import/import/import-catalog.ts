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


/**
 * @author Daniel de Oliveira
 */
export function buildImportCatalogFunction(services: ImportCatalogServices,
                                           context: ImportCatalogContext): ImportFunction {

    return async function importCatalog(importDocuments: Array<Document>)
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            assertProjectAlwaysTheSame(importDocuments);
            const catalogResourceId = getCatalogResourceid(importDocuments);
            const [
                existingCatalogDocuments,
                existingDocumentsRelatedImages,
                existingCatalogAndImageDocuments
            ] = await getExistingDocuments(services, catalogResourceId);

            assertRelationsValid(importDocuments);
            assertNoDeletionOfRelatedTypes(existingCatalogDocuments, importDocuments);

            const updateDocuments = await asyncMap(importDocuments,
                importOneDocument(services, context, existingCatalogAndImageDocuments));

            await removeRelatedImages(
                services, updateDocuments, existingDocumentsRelatedImages);
            await removeObsoleteCatalogDocuments(
                services, existingCatalogDocuments, updateDocuments);
            return { errors: [], successfulImports: updateDocuments.length };

        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
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
                                   updateDocuments: Array<Document>, // contains non image docs, but does not matter
                                   existingDocumentsRelatedImages: Array<Document>) {

    const diffImages = subtract(on(RESOURCE_ID_PATH), updateDocuments)(existingDocumentsRelatedImages);
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


function getCatalogResourceid(importDocuments: Array<Document>) {

    const typeCatalogDocuments =
        importDocuments.filter(_ => _.resource.category === 'TypeCatalog');
    if (typeCatalogDocuments.length !== 1) throw [ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS];
    return typeCatalogDocuments[0].resource.id;
}


async function getExistingDocuments(services: ImportCatalogServices,
                                    catalogResourceId: string)
    : Promise<[Array<Document>, Array<Document>, Lookup<Document>]> {

    const catalogDocuments = await services.relationsManager.get(catalogResourceId, { descendants: true });
    const imageDocuments = await services.imageRelationsManager.getLinkedImages(catalogDocuments);

    return [
        catalogDocuments,
        imageDocuments,
        makeDocumentsLookup(catalogDocuments.concat(imageDocuments))
    ];
}


function importOneDocument(services: ImportCatalogServices,
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
            if (existingDocument.resource.category === 'Type' || existingDocument.resource.category === 'TypeCatalog') {
                const oldRelations = clone(existingDocument.resource.relations[TypeRelations.HASINSTANCE]);
                updateDocument.resource = clone(document.resource);
                updateDocument.resource.relations[TypeRelations.HASINSTANCE] = oldRelations;
            } else {
                updateDocument.resource = clone(document.resource);
            }
            await services.datastore.update(updateDocument, context.username);
        } else {
            await services.datastore.create(updateDocument, context.username);
        }

        return updateDocument;
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
        else {
            if (isUndefinedOrEmpty(document.resource.relations[ImageRelations.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            for (const target_ of document.resource.relations[ImageRelations.DEPICTS]) {
                const target = lookup[target_];
                if (target === undefined
                    || !target.resource.relations[ImageRelations.ISDEPICTEDIN].includes(document.resource.id)) {
                    throw [ImportCatalogErrors.INVALID_RELATIONS];
                }
            }
        }
    }
}
