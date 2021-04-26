import { Document, Datastore, Relations, Lookup, ON_RESOURCE_ID } from 'idai-field-core';
import { aMap, isArray, clone, isNot, isUndefinedOrEmpty, set, subtract, to, undefinedOrEmpty } from 'tsfun';
import { Imagestore } from '../../images/imagestore/imagestore';
import { ImageRelationsManager } from '../../model/image-relations-manager';
import { RelationsManager } from '../../model/relations-manager';
import { makeDocumentsLookup } from './utils';


export interface ImportCatalogServices {

    datastore: Datastore;
    relationsManager: RelationsManager;
    imageRelationsManager: ImageRelationsManager;
    imagestore: Imagestore
}


export interface ImportCatalogContext {

    username: string;
    selectedProject: string;
}


export module ImportCatalogErrors {

    export const CATALOG_DOCUMENTS_IDENTIFIER_CLASH = 'ImportCatalogErrors.identifierClashesDetected';
    export const CATALOG_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES = 'ImportCatalogErrors.ownerMustNotOverwriteLocalImages';
    export const CATALOG_OWNER_MUST_NOT_REIMPORT_CATALOG = 'ImportCatalogErrors.mustNotReimportCatalogAsOwner';
    export const CONNECTED_TYPE_DELETED = 'ImportCatalogErrors.connectedTypeDeleted';
    export const DIFFERENT_PROJECT_ENTRIES = 'ImportCatalogErrors.differentProjectEntries';
    export const NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS = 'ImportCatalogErrors.noOrTooManyTypeCatalogDocuments';
    export const INVALID_RELATIONS = 'ImportCatalogErrors.invalidRelations';
}


/**
 * @author Daniel de Oliveira
 */
export function buildImportCatalog(services: ImportCatalogServices,
                                   context: ImportCatalogContext) {

    return async function importCatalog(importDocuments: Array<Document>)
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            assertProjectAlwaysTheSame(importDocuments);
            const importCatalog = getImportTypeCatalog(importDocuments);

            if (importCatalog.project === context.selectedProject) { // owned catalog
                await assertCatalogNotOwned(services, context, importCatalog);
                await assertNoImagesOverwritten(services, context, importDocuments);
            }
            await assertNoIdentifierClashes(services, importDocuments);

            const [
                existingCatalogDocuments,
                existingDocumentsRelatedImages,
                existingCatalogAndImageDocuments
            ] = await getExistingDocuments(services, importCatalog.resource.id);


            assertRelationsValid(importDocuments);
            assertNoDeletionOfRelatedTypes(existingCatalogDocuments, importDocuments);

            const updateDocuments = await aMap(importDocuments,
                importOneDocument(services, context, existingCatalogAndImageDocuments));

            await removeRelatedImages(
                services, updateDocuments, existingDocumentsRelatedImages);
            await removeObsoleteCatalogDocuments(
                services, existingCatalogDocuments, updateDocuments);
            return { errors: [], successfulImports: updateDocuments.length };

        } catch (errWithParams) {

            await cleanUpLeftOverImagesFromReader(services, importDocuments);
            return { errors: [errWithParams], successfulImports: 0 };
        }
    }
}


async function assertNoIdentifierClashes(services: ImportCatalogServices,
                                         importDocuments: Array<Document>) {

    const clashes = [];
    for (const document of importDocuments) {
        const found =
            await services.datastore.find(
                { constraints: { 'identifier:match': document.resource.identifier } });

        if (found.totalCount > 0
            && (document.resource.id !== found.documents[0].resource.id
                // This is just to double check. Even if it has the same id and same identifier
                // we won't import it if it is owned by the user.
                // Currrently reimport of catalog as owner is forbidden, so this won't interfere there.
                || found.documents[0].project === undefined)
        ) {
            clashes.push(document.resource.identifier);
        }
    }
    if (clashes.length > 0) {
        throw [ImportCatalogErrors.CATALOG_DOCUMENTS_IDENTIFIER_CLASH, clashes.join(',')];
    }
}


async function cleanUpLeftOverImagesFromReader(services: ImportCatalogServices,
                                               importDocuments: Array<Document>) {

    for (const document of importDocuments) {
        if (document.resource.category === 'Type') continue;
        if (document.resource.category === 'TypeCatalog') continue;
        try {
            await services.datastore.get(document.resource.id);
        } catch {
            try {
                await services.imagestore.remove(document.resource.id, { fs: true });
            } catch (e) {
                console.error('error during cleanup', e);
            }
        }
    }
}


async function assertNoImagesOverwritten(services: ImportCatalogServices,
                                         context: ImportCatalogContext,
                                         importDocuments: Array<Document>) {

    for (const document of importDocuments) {
        if (document.resource.category !== 'Type' && document.resource.category !== 'TypeCatalog') {
            let found = false;
            try {
                await services.datastore.get(document.resource.id);
                found = true;
            } catch {}
            if (found) throw [ImportCatalogErrors.CATALOG_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES];
        }
    }
}


// This is here to us not having to handle certain edge cases with deletions and
// images related to not only catalog but also other resources. For now, we oblige
// the owner of the catalog to remove the catalog consciously so that he then can
// re-import it afterwards.
async function assertCatalogNotOwned(services: ImportCatalogServices,
                                     context: ImportCatalogContext,
                                     importCatalog: Document) {


    let existingCatalogIdentifier = undefined;
    try {
        const existingCatalog = await services.datastore.get(importCatalog.resource.id);
        existingCatalogIdentifier = existingCatalog.resource.identifier;
    } catch {}
    if (existingCatalogIdentifier !== undefined) {
        throw [ImportCatalogErrors.CATALOG_OWNER_MUST_NOT_REIMPORT_CATALOG, existingCatalogIdentifier];
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

    const diff = subtract(ON_RESOURCE_ID, updateDocuments)(existingDocuments);
    for (const d of diff) {
        await services.datastore.remove(d);
    }
}


async function removeRelatedImages(services: ImportCatalogServices,
                                   updateDocuments: Array<Document>, // contains non image docs, but does not matter
                                   existingDocumentsRelatedImages: Array<Document>) {

    const diffImages = subtract(ON_RESOURCE_ID, updateDocuments)(existingDocumentsRelatedImages);
    for (const diff of diffImages) {
        await services.imagestore.remove(diff.resource.id);
        await services.datastore.remove(diff);
    }
}


function assertNoDeletionOfRelatedTypes(existingDocuments: Array<Document>,
                                        importDocuments: Array<Document>) {

    const removedDocuments = subtract(ON_RESOURCE_ID, importDocuments)(existingDocuments);
    const problems = [];
    for (const removedDocument of removedDocuments) {
        if (isNot(undefinedOrEmpty)(removedDocument.resource.relations[Relations.Type.HASINSTANCE])) {
            problems.push(removedDocument.resource.identifier);
        }
    }
    if (problems.length > 0 ) throw [
        ImportCatalogErrors.CONNECTED_TYPE_DELETED,
        problems.join(',')];
}


function getImportTypeCatalog(importDocuments: Array<Document>) {

    const typeCatalogDocuments =
        importDocuments.filter(_ => _.resource.category === 'TypeCatalog');
    if (typeCatalogDocuments.length !== 1) throw [ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS];
    return typeCatalogDocuments[0];
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
        const updateDocument = Document.clone(existingDocument ?? document);

        if (document.project === context.selectedProject) delete updateDocument.project;

        if (existingDocument) {
            if (existingDocument.resource.category === 'Type' || existingDocument.resource.category === 'TypeCatalog') {
                const oldRelations = clone(existingDocument.resource.relations[Relations.Type.HASINSTANCE]);
                updateDocument.resource = clone(document.resource);
                if (oldRelations) updateDocument.resource.relations[Relations.Type.HASINSTANCE] = oldRelations;
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
            if (isNot(undefinedOrEmpty)(document.resource.relations[Relations.Hierarchy.LIESWITHIN])
                || isNot(undefinedOrEmpty)(document.resource.relations[Relations.Image.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }
        if (document.resource.category === 'Type' ) {
            if (!isArray(document.resource.relations[Relations.Hierarchy.LIESWITHIN])
                || document.resource.relations[Relations.Hierarchy.LIESWITHIN].length !== 1) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            const target = lookup[document.resource.relations[Relations.Hierarchy.LIESWITHIN][0]];
            if (target === undefined
                || (target.resource.category !== 'Type' && target.resource.category !== 'TypeCatalog')) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }

        if (document.resource.category === 'Type' || document.resource.category === 'TypeCatalog') {
            if (!isUndefinedOrEmpty(document.resource.relations[Relations.Image.ISDEPICTEDIN])) {
                for (const target_ of document.resource.relations[Relations.Image.ISDEPICTEDIN]) {
                    const target = lookup[target_];
                    if (target === undefined
                        || !target.resource.relations[Relations.Image.DEPICTS].includes(document.resource.id)) {
                        throw [ImportCatalogErrors.INVALID_RELATIONS];
                    }
                }
            }
        }
        else {
            if (isUndefinedOrEmpty(document.resource.relations[Relations.Image.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            for (const target_ of document.resource.relations[Relations.Image.DEPICTS]) {
                const target = lookup[target_];
                if (target === undefined
                    || !target.resource.relations[Relations.Image.ISDEPICTEDIN].includes(document.resource.id)) {
                    throw [ImportCatalogErrors.INVALID_RELATIONS];
                }
            }
        }
    }
}
