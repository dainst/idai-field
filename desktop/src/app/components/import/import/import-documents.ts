import { Map, Either, Array1 } from 'tsfun';
import { Document, Resource, Relation } from 'idai-field-core';
import { ImportValidator } from './process/import-validator';
import { Find, Get } from './types';
import { complementInverseRelationsBetweenImportDocs, makeSureRelationStructuresExists,
    preprocessRelations } from './preprocess-relations';
import { preprocessFields } from './preprocess-fields';
import { ImportErrors as E } from './import-errors';
import LIES_WITHIN = Relation.Hierarchy.LIESWITHIN;
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;
import { processDocuments } from './process/process-documents';
import { processRelations } from './process/process-relations';
import { Settings } from '../../../services/settings/settings';


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    operationId?: string;
    useIdentifiersInRelations?: boolean;
    ignoreUnconfiguredFields?: boolean;
}


export interface ImportHelpers {

    get: Get;
    find: Find;
    generateId: () => string;
    preprocessDocument: (_: Document) => Document;
    postprocessDocument: (_: Document) => Document;
}


export interface ImportServices {

    validator: ImportValidator
}


export interface ImportContext {

    operationCategories: string[];
    inverseRelationsMap: Relation.InverseRelationsMap;
    settings: Settings;
}


export interface ImportResult {

    createDocuments: Array<Document>;
    updateDocuments: Array<Document>;
    targetDocuments: Array<Document>;
    ignoredIdentifiers: string[];
}


export type ErrWithParams = Array1<string>;
export type CreateDocuments = Array<Document>;
export type UpdateDocuments = Array<Document>;
export type TargetDocuments = Array<Document>;

export type Result = Either<ErrWithParams, ImportResult>;
export type Documents2Result = (_: Array<Document>) => Promise<Result>;


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 *
 * @returns Documents2Result, which expects
 *   documents with the field resource.identifier set to a non empty string.
 *   If resource.id is set, it will be taken as document.id, otherwise a new id gets generated.
 *   The relations map is assumed to be at least existent, but can be empty. // TODO REVIEW, than we can omit creation of it and only assert that it is there
 *   The resource.category field may be empty.
 */
export function buildImportDocuments(services: ImportServices, context: ImportContext, helpers: ImportHelpers,
                                     options: ImportOptions = {}): Documents2Result {

    if (options.mergeMode) {
        if (!options.useIdentifiersInRelations) {
            throw 'FATAL - illegal arguments - '
            + 'useIdentifiersInRelations must also be set when merge mode selected';
        }
        if (options.operationId) {
            throw 'FATAL - illegal argument combination '
            + '- mergeMode and operationId must not be both truthy';
        }
    }

    return (documents: Array<Document>) => importDocuments(
            services, context, helpers, options, documents);
}


async function importDocuments(services: ImportServices, context: ImportContext, helpers: ImportHelpers,
                               options: ImportOptions, documents: Array<Document>): Promise<Result> {

    makeSureRelationStructuresExists(documents);
    complementInverseRelationsBetweenImportDocs(context, options, documents);

    try {
        const existingImportDocuments = await makeExistingDocumentsMap(helpers.find, options, documents);
        const { documentsToImport, documentsToIgnore } = getDocumentsToImport(existingImportDocuments, options, documents);

        preprocessFields(documentsToImport, options);
        await preprocessRelations(documentsToImport, helpers, options);
        const mergeDocs = preprocessDocuments(existingImportDocuments, helpers, options, documentsToImport);
        const processedDocuments = processDocuments(
            documentsToImport, mergeDocs, services.validator, options.ignoreUnconfiguredFields
        );
        const targetDocuments = await processRelations(
            processedDocuments,
            services.validator,
            context.operationCategories,
            helpers.get,
            context.inverseRelationsMap,
            options
        );
        const postprocessedDocuments = processedDocuments.map(helpers.postprocessDocument);
        const ignoredIdentifiers = documentsToIgnore.map(_ => _.resource.identifier);

        return options.mergeMode === true
            ? [undefined, {
                createDocuments: [],
                updateDocuments: postprocessedDocuments,
                targetDocuments,
                ignoredIdentifiers
            }]
            : [undefined, {
                createDocuments: postprocessedDocuments,
                updateDocuments: [],
                targetDocuments,
                ignoredIdentifiers
            }];

    } catch (errWithParams) {
        if (errWithParams[0] === E.TARGET_CATEGORY_RANGE_MISMATCH
                && ([LIES_WITHIN, RECORDED_IN].includes(errWithParams[2]))) errWithParams[2] = Relation.PARENT;
        return [errWithParams, undefined];
    }
}


async function makeExistingDocumentsMap(find: Find, options: ImportOptions,
                                        documents: Array<Document>): Promise<Map<Document>> {

    if (!options.useIdentifiersInRelations) return {};

    const result = {};

    for (const document of documents) {
        const identifier: string = document.resource[Resource.IDENTIFIER]; // not a FieldDocument yet
        if (!identifier) continue;
        const existingDocument: Document = await find(identifier);
        if (!existingDocument) continue;
        if (existingDocument.warnings) throw [E.WARNINGS_EXIST, existingDocument.resource.identifier];
        result[identifier] = existingDocument;
    }

    return result;
}


function getDocumentsToImport(existingDocumentsMap: Map<Document>, options: ImportOptions, documents: Array<Document>)
        : { documentsToImport: Array<Document>, documentsToIgnore: Array<Document> } {

    const existingDocuments = documents.filter(document => {
        return existingDocumentsMap[document.resource.identifier] !== undefined;
    });
    const missingDocuments = documents.filter(document => {
        return existingDocumentsMap[document.resource.identifier] === undefined;
    });

    return options.mergeMode
        ? { documentsToImport: existingDocuments, documentsToIgnore: missingDocuments }
        : { documentsToImport: missingDocuments, documentsToIgnore: existingDocuments };
}


function preprocessDocuments(existingDocuments: Map<Document>, helpers: ImportHelpers, options: ImportOptions,
                             documents: Array<Document>): Map<Document> {

    const mergeDocs = {};

    for (let document of documents) {
        const existingDocument = existingDocuments[document.resource.identifier];
        if (options.mergeMode === true) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];

            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;

            mergeDocs[existingDocument.resource.id] = helpers.preprocessDocument(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }

    return mergeDocs;
}
