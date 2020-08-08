import {identity} from 'tsfun';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Updater} from './updater';
import {ImportFunction} from './types';
import {assertLegalCombination, findByIdentifier} from './utils';
import {process} from './process/process';
import {preprocessRelations} from './preprocess-relations';
import {preprocessFields} from './preprocess-fields';
import {ImportErrors as E} from './import-errors';
import {HierarchicalRelations, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HierarchicalRelations.LIESWITHIN;
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {InverseRelationsMap} from '../../configuration/inverse-relations-map';
import {processDocuments} from './process/process-documents';


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    operationId?: string;
    useIdentifiersInRelations?: boolean;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildImportFunction(validator: ImportValidator,
                                    operationCategoryNames: string[],
                                    inverseRelationsMap: InverseRelationsMap,
                                    generateId: () => string,
                                    preprocessDocument: (_: Document) => Document = identity,
                                    postprocessDocument: (_: Document) => Document = identity,
                                    importOptions: ImportOptions = {}): ImportFunction {

    assertLegalCombination(importOptions.mergeMode, importOptions.operationId);

    /**
     * @param documents documents with the field resource.identifier set to a non empty string.
     *   If resource.id is set, it will be taken as document.id on creation.
     *   The relations map is assumed to be at least existent, but can be empty.
     *   The resource.category field may be empty.
     * @param datastore
     * @param username
     */
    return async function importDocuments(documents: Array<Document>,
                                          datastore: DocumentDatastore,
                                          username: string): Promise<{ errors: string[][], successfulImports: number }> {

        const get = (resourceId: string) => datastore.get(resourceId);

        try {
            preprocessFields(documents, importOptions.permitDeletions === true);
            await preprocessRelations(documents,
                generateId, findByIdentifier(datastore), get, importOptions);
        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
        }

        let processedDocuments: any = undefined;
        try {
            const mergeDocs = await preprocessDocuments(
                documents,
                findByIdentifier(datastore),
                preprocessDocument as Function,
                importOptions.mergeMode === true);
            processedDocuments = processDocuments(documents, mergeDocs, validator);
        } catch (err) {
            return {errors: [err], successfulImports: 0};
        }

        const [importDocuments, targetDocuments, msgWithParams] = await process(
            processedDocuments,
            validator,
            operationCategoryNames,
            get,
            inverseRelationsMap,
            importOptions
        );

        if (msgWithParams) {
            if (msgWithParams[0] === E.TARGET_CATEGORY_RANGE_MISMATCH
                && ([LIES_WITHIN, RECORDED_IN].includes(msgWithParams[2]))) msgWithParams[2] = PARENT;
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const documentsForImport = importDocuments.map(postprocessDocument);

        const updateErrors = [];
        try {
            await Updater.go(
                documentsForImport,
                targetDocuments,
                datastore,
                username,
                importOptions.mergeMode === true);
        } catch (errWithParams) {
            updateErrors.push(errWithParams)
        }
        return { errors: updateErrors, successfulImports: documents.length };
    }
}


async function preprocessDocuments(documents: Array<Document>,
                                   find: Function,
                                   preprocess: Function,
                                   mergeMode: boolean): Promise<{ [resourceId: string]: Document }> {

    const mergeDocs = {};

    for (let document of documents) {
        const existingDocument = await find(document.resource.identifier);
        if (mergeMode) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];

            // TODO do this in processDocuments
            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;
            //

            mergeDocs[existingDocument.resource.id] = preprocess(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }

    return mergeDocs;
}
