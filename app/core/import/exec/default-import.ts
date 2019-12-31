import {identity} from 'tsfun';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Updater} from './updater';
import {ImportFunction} from './types';
import {assertLegalCombination, findByIdentifier} from './utils';
import {MERGE_TARGET, process} from './process/process';
import {preprocessRelations} from './preprocess-relations';
import {preprocessFields} from './preprocess-fields';
import {ImportErrors as E} from './import-errors';
import {HIERARCHICAL_RELATIONS, PARENT} from '../../model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;


export interface ImportOptions {

    mergeMode?: boolean;
    permitDeletions?: boolean;
    mainTypeDocumentId?: string;
    useIdentifiersInRelations?: boolean;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildImportFunction(validator: ImportValidator,
                                    operationTypeNames: string[],
                                    inverseRelationsMap: {[_: string]: string},
                                    generateId: () => string,
                                    preprocessDocument: undefined|((_: Document) => Document),  // TODO test in default-import.spec
                                    postprocessDocument: undefined|((_: Document) => Document),
                                    importOptions: ImportOptions = {}): ImportFunction {

    if (!preprocessDocument) preprocessDocument = identity;
    if (!postprocessDocument) postprocessDocument = identity;

    assertLegalCombination(importOptions.mergeMode, importOptions.mainTypeDocumentId);

    /**
     * @param datastore
     * @param username
     * @param documents documents with the field resource.identifier set to a non empty string.
     *   If resource.id is set, it will be taken as document.id on creation.
     *   The relations map is assumed to be at least existent, but can be empty.
     *   The resource.type field may be empty.
     * @param importReport
     *   .errors of ImportError or Validation Error
     */
    return async function importFunction(documents: Array<Document>,
                                         datastore: DocumentDatastore,
                                         username: string): Promise<{ errors: string[][], successfulImports: number }> {

        const get = (resourceId: string) => datastore.get(resourceId);

        try {
            preprocessFields(documents, importOptions.permitDeletions === true);
            await preprocessDocuments(documents,
                findByIdentifier(datastore), preprocessDocument as Function, importOptions.mergeMode === true);
            await preprocessRelations(documents,
                generateId, findByIdentifier(datastore), get, importOptions);
        } catch (errWithParams) {
            return { errors: [errWithParams], successfulImports: 0 };
        }

        const [importDocuments, targetDocuments, msgWithParams] = await process(
            documents,
            validator,
            operationTypeNames,
            get,
            inverseRelationsMap,
            importOptions
        );

        if (msgWithParams) {
            if (msgWithParams[0] === E.TARGET_TYPE_RANGE_MISMATCH
                && ([LIES_WITHIN, RECORDED_IN].includes(msgWithParams[2]))) msgWithParams[2] = PARENT;
            return { errors: [msgWithParams], successfulImports: 0 };
        }

        const documentsForImport = importDocuments.map(postprocessDocument as any) as Document[];

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
                                   mergeMode: boolean) {

    for (let document of documents) {
        const existingDocument = await find(document.resource.identifier);
        if (mergeMode) {
            if (!existingDocument) throw [E.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
            document._id = existingDocument._id;
            document.resource.id = existingDocument.resource.id;
            (document as any)[MERGE_TARGET] = preprocess(existingDocument);
        } else if (existingDocument) {
            throw [E.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
    }
}

