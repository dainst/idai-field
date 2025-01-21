import { aMap, isArray, clone, isUndefinedOrEmpty, set, subtract, to } from 'tsfun';
import { Document, Datastore, Relation, Lookup, ON_RESOURCE_ID, RelationsManager, Resource, childrenOf,
    ImageStore } from 'idai-field-core';
import { makeDocumentsLookup } from './utils';
import { ImageRelationsManager } from '../../../services/image-relations-manager';


export interface ImportCatalogServices {

    datastore: Datastore;
    relationsManager: RelationsManager;
    imageRelationsManager: ImageRelationsManager;
    imagestore: ImageStore;
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
    export const INVALID_CATEGORY = 'ImportCatalogErrors.invalidCategory';
}


/**
 * @author Daniel de Oliveira
 */
export function buildImportCatalog(services: ImportCatalogServices, context: ImportCatalogContext,
                                   typeCategoryNames: string[], imageCategoryNames: string[]) {

    return async function importCatalog(importDocuments: Array<Document>)
        : Promise<{ errors: string[][], successfulImports: number }> {

        try {
            assertProjectAlwaysTheSame(importDocuments);
            const importCatalog = getImportTypeCatalog(importDocuments);

            if (isOwned(context, importCatalog)) {
                await assertCatalogNotOwned(services, importCatalog);
                await assertNoImagesOverwritten(services, importDocuments, typeCategoryNames);
                for (const importDocument of importDocuments) {
                    delete importDocument.project;
                }
            }
            await assertNoIdentifierClashes(services, importDocuments);

            const [
                existingCatalogDocuments,
                existingDocumentsRelatedImages,
                existingCatalogAndImageDocuments
            ] = await getExistingDocuments(services, importCatalog.resource.id);

            assertCategoriesValid(importDocuments, typeCategoryNames, imageCategoryNames);
            assertRelationsValid(importDocuments, typeCategoryNames);
            assertNoDeletionOfRelatedTypes(existingCatalogDocuments, importDocuments);

            const updateDocuments = await aMap(importDocuments,
                importOneDocument(services, existingCatalogAndImageDocuments, typeCategoryNames));

            await removeRelatedImages(
                services, updateDocuments, existingDocumentsRelatedImages
            );
            await removeObsoleteCatalogDocuments(
                services, existingCatalogDocuments, updateDocuments
            );
            return { errors: [], successfulImports: updateDocuments.length };
        } catch (errWithParams) {
            await cleanUpLeftOverImagesFromReader(services, importDocuments, typeCategoryNames);
            return { errors: [errWithParams], successfulImports: 0 };
        }
    }
}


async function assertNoIdentifierClashes(services: ImportCatalogServices, importDocuments: Array<Document>) {

    const clashes = [];
    for (const document of importDocuments) {
        const found =
            await services.datastore.find(
                { constraints: { 'identifier:match': document.resource.identifier } });

        if (found.totalCount > 0
            && (document.project !== found.documents[0].project
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


async function cleanUpLeftOverImagesFromReader(services: ImportCatalogServices, importDocuments: Array<Document>,
                                               typeCategoryNames: string[]) {

    for (const document of importDocuments) {
        if (typeCategoryNames.includes(document.resource.category)) continue;
        if (document.resource.category === 'TypeCatalog') continue;
        try {
            await services.datastore.get(document.resource.id);
        } catch {
            try {
                await services.imagestore.remove(document.resource.id);
            } catch (e) {
                console.error('error during cleanup', e);
            }
        }
    }
}


async function assertNoImagesOverwritten(services: ImportCatalogServices, importDocuments: Array<Document>,
                                         typeCategoryNames: string[]) {

    for (const document of importDocuments) {
        if (!typeCategoryNames.includes(document.resource.category) && document.resource.category !== 'TypeCatalog') {
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
async function assertCatalogNotOwned(services: ImportCatalogServices, importCatalog: Document) {


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


async function removeObsoleteCatalogDocuments(services: ImportCatalogServices, existingDocuments: Array<Document>,
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


function assertNoDeletionOfRelatedTypes(existingDocuments: Array<Document>, importDocuments: Array<Document>) {

    const removedDocuments = subtract(ON_RESOURCE_ID, importDocuments)(existingDocuments);
    const problems = [];
    for (const removedDocument of removedDocuments) {
        if (!isUndefinedOrEmpty(removedDocument.resource.relations[Relation.Type.HASINSTANCE])) {
            problems.push(removedDocument.resource.identifier);
        }
    }
    if (problems.length > 0 ) {
        throw [
            ImportCatalogErrors.CONNECTED_TYPE_DELETED,
            problems.join(',')
        ];
    }
}


function getImportTypeCatalog(importDocuments: Array<Document>): Document {

    const typeCatalogDocuments =
        importDocuments.filter(_ => _.resource.category === 'TypeCatalog');
    if (typeCatalogDocuments.length !== 1) throw [ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS];
    return typeCatalogDocuments[0];
}


async function getExistingDocuments(services: ImportCatalogServices, typeCatalog: Resource.Id)
        : Promise<[Array<Document>, Array<Document>, Lookup<Document>]> {

    const catalogAndTypes = await fetchExistingCatalogWithTypes(services, typeCatalog);
    const imageDocuments = await services.imageRelationsManager.getLinkedImages(catalogAndTypes);

    return [
        catalogAndTypes,
        imageDocuments,
        makeDocumentsLookup(catalogAndTypes.concat(imageDocuments))
    ];
}


async function fetchExistingCatalogWithTypes(services: ImportCatalogServices, typeCatalog: Resource.Id)
        : Promise<Array<Document>> {

    try {
        return [await services.datastore.get(typeCatalog)].concat(
                (await services.datastore.find(childrenOf(typeCatalog))).documents
            );
    } catch /*(catalog) document not found*/ { return []; }
}


function importOneDocument(services: ImportCatalogServices, existingDocuments: Lookup<Document>,
                           typeCategoryNames: string[]) {

    return async (document: Document) => {

        delete document[Document._REV];
        delete document[Document.MODIFIED];
        delete document[Document.CREATED];

        const existingDocument: Document|undefined = existingDocuments[document.resource.id];
        const updateDocument = Document.clone(existingDocument ?? document);

        if (!existingDocument) {
            await services.datastore.create(updateDocument);
            return updateDocument;
        }

        if (isTypeOrCatalog(existingDocument, typeCategoryNames)) {
            const oldRelations = clone(existingDocument.resource.relations[Relation.Type.HASINSTANCE]);
            updateDocument.resource = clone(document.resource);
            if (oldRelations) updateDocument.resource.relations[Relation.Type.HASINSTANCE] = oldRelations;
            await services.datastore.update(updateDocument);
        } else {
            await services.datastore.remove(existingDocument);
            await services.datastore.create(updateDocument);
        }
        return updateDocument;
    }
}


function isOwned(context: ImportCatalogContext, document: Document) {

    return document.project === context.selectedProject;
}


function isTypeOrCatalog(document: Document, typeCategoryNames: string[]) {

    return typeCategoryNames.includes(document.resource.category) || document.resource.category === 'TypeCatalog';
}


function assertCategoriesValid(documents: Array<Document>, typeCategoryNames: string[], imageCategoryNames: string[]) {

    const allowedCategoryNames: string[] = ['TypeCatalog'].concat(typeCategoryNames).concat(imageCategoryNames);
    const categoryNames: string[] = set(documents.map(document => document.resource.category));

    for (let categoryName of categoryNames) {
        if (!allowedCategoryNames.includes(categoryName)) {
            throw [ImportCatalogErrors.INVALID_CATEGORY, categoryName];
        }
    }
}


function assertRelationsValid(documents: Array<Document>, typeCategoryNames: string[]) {

    const lookup = makeDocumentsLookup(documents);

    for (const document of documents) {
        if (document.resource.category === 'TypeCatalog') {
            if (!isUndefinedOrEmpty(document.resource.relations[Relation.Hierarchy.LIESWITHIN])
                || !isUndefinedOrEmpty(document.resource.relations[Relation.Image.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }
        if (typeCategoryNames.includes(document.resource.category)) {
            if (!isArray(document.resource.relations[Relation.Hierarchy.LIESWITHIN])
                || document.resource.relations[Relation.Hierarchy.LIESWITHIN].length !== 1) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            const target = lookup[document.resource.relations[Relation.Hierarchy.LIESWITHIN][0]];
            if (target === undefined
                || (!typeCategoryNames.includes(target.resource.category)
                    && target.resource.category !== 'TypeCatalog')) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
        }

        if (typeCategoryNames.includes(document.resource.category) || document.resource.category === 'TypeCatalog') {
            if (!isUndefinedOrEmpty(document.resource.relations[Relation.Image.ISDEPICTEDIN])) {
                for (const target_ of document.resource.relations[Relation.Image.ISDEPICTEDIN]) {
                    const target = lookup[target_];
                    if (target === undefined
                        || !target.resource.relations[Relation.Image.DEPICTS]?.includes(document.resource.id)) {
                        throw [ImportCatalogErrors.INVALID_RELATIONS];
                    }
                }
            }
        }
        else {
            if (isUndefinedOrEmpty(document.resource.relations[Relation.Image.DEPICTS])) {
                throw [ImportCatalogErrors.INVALID_RELATIONS];
            }
            for (const target_ of document.resource.relations[Relation.Image.DEPICTS]) {
                const target = lookup[target_];
                if (target === undefined
                    || !target.resource.relations[Relation.Image.ISDEPICTEDIN]?.includes(document.resource.id)) {
                    throw [ImportCatalogErrors.INVALID_RELATIONS];
                }
            }
        }
    }
}
