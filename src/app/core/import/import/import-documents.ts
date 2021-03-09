import {identity} from 'tsfun';
import {filter as asyncFilter} from 'tsfun/async';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Updater} from './updater';
import {Find, ImportFunction} from './types';
import {assertLegalCombination, findByIdentifier} from './utils';
import {preprocessRelations} from './preprocess-relations';
import {preprocessFields} from './preprocess-fields';
import {ImportErrors as E} from './import-errors';
import {HierarchicalRelations, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {InverseRelationsMap} from '../../configuration/inverse-relations-map';
import {processDocuments} from './process/process-documents';
import {processRelations} from './process/process-relations';
import {Settings} from '../../settings/settings';


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    operationId?: string;
    useIdentifiersInRelations?: boolean;
    differentialImport?: true;
}


export interface ImportHelpers {

    generateId: () => string;
    preprocessDocument: (_: Document) => Document;
    postprocessDocument: (_: Document) => Document;
}


export interface ImportServices {

    validator: ImportValidator,
    datastore: DocumentDatastore
}


export interface ImportContext {

    operationCategoryNames: string[];
    inverseRelationsMap: InverseRelationsMap;
    settings: Settings;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildImportFunction(services: ImportServices,
                                    context: ImportContext,
                                    helpers: ImportHelpers,
                                    options: ImportOptions = {}): ImportFunction {

    assertLegalCombination(options);
    const get  = (resourceId: string) => services.datastore.get(resourceId);
    const find = findByIdentifier(services.datastore);

    /**
     * @param documents documents with the field resource.identifier set to a non empty string.
     *   If resource.id is set, it will be taken as document.id on creation.
     *   The relations map is assumed to be at least existent, but can be empty.
     *   The resource.category field may be empty.
     */
    return async function importDocuments(documents: Array<Document>): Promise<{ errors: string[][], successfulImports: number }> {

        documents = options.differentialImport !== true
            ? documents
            : await asyncFilter(documents, async document =>
                (await find(document.resource.identifier)) === undefined);

        try {
            preprocessFields(documents, options.permitDeletions === true);
            await preprocessRelations(documents,
                helpers.generateId, find, get, options);
        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
        }

        let processedDocuments: any = undefined;
        try {
            const mergeDocs = await preprocessDocuments(
                find,
                helpers.preprocessDocument ?? identity,
                options.mergeMode === true,
                documents);
            processedDocuments = processDocuments(documents, mergeDocs, services.validator);
        } catch (msgWithParams) {
            return { errors: [msgWithParams], successfulImports: 0};
        }

        let targetDocuments;
        try {
            targetDocuments = await processRelations(
                processedDocuments,
                services.validator,
                context.operationCategoryNames,
                get,
                context.inverseRelationsMap,
                options
            );
        } catch (msgWithParams) {
            if (msgWithParams[0] === E.TARGET_CATEGORY_RANGE_MISMATCH
                && ([LIES_WITHIN, RECORDED_IN].includes(msgWithParams[2]))) msgWithParams[2] = PARENT;
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const documentsForImport = processedDocuments.map(helpers.postprocessDocument ?? identity);

        const updateErrors = [];
        try {
            await Updater.go(
                documentsForImport,
                targetDocuments,
                services.datastore,
                context.settings.username,
                options.mergeMode === true);
        } catch (errWithParams) {
            updateErrors.push(errWithParams)
        }
        return { errors: updateErrors, successfulImports: documents.length };
    }
}


async function preprocessDocuments(find: Find,
                                   preprocess: Function,
                                   mergeMode: boolean,
                                   documents: Array<Document>): Promise<{ [resourceId: string]: Document }> {

    const mergeDocs = {};

    for (let document of documents) {
        const existingDocument = await find(document.resource.identifier);
        if (mergeMode) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];

            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;

            mergeDocs[existingDocument.resource.id] = preprocess(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }

    return mergeDocs;
}
