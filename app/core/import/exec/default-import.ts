import {identity} from 'tsfun';
import {Document} from 'idai-components-2';
import {ImportValidator} from './process/import-validator';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {Updater} from './updater';
import {ImportFunction} from './types';
import {assertLegalCombination, findByIdentifier} from './utils';
import {process} from './process/process';
import {preprocessRelations} from './preprocess-relations';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function buildImportFunction(validator: ImportValidator,
                                    operationTypeNames: string[],
                                    getInverseRelation: (_: string) => string|undefined,
                                    generateId: () => string,
                                    postProcessDocument: (_: Document) => Document = identity) {

    return (mergeMode: boolean,
            allowOverwriteRelationsInMergeMode: boolean,
            mainTypeDocumentId: string = '' /* '' => no assignment */,
            useIdentifiersInRelations: boolean = false): ImportFunction => {

        assertLegalCombination(mainTypeDocumentId, mergeMode);

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

            const find = findByIdentifier(datastore);
            const get  = (resourceId: string) => datastore.get(resourceId);

            try {
                await preprocessRelations(documents, generateId, find, get,
                    mergeMode, allowOverwriteRelationsInMergeMode, useIdentifiersInRelations);
            } catch (errWithParams) { return { errors: [errWithParams], successfulImports: 0 }}

            const result = await process(
                documents,
                validator,
                operationTypeNames,
                find,
                get,
                getInverseRelation,
                mergeMode,
                allowOverwriteRelationsInMergeMode,
                mainTypeDocumentId);

            if (result[2]) return { errors: [result[2]], successfulImports: 0 };

            result[0] = result[0].map(postProcessDocument);

            const updateErrors = [];
            try {
                await Updater.go(
                    result[0],
                    result[1], datastore, username, mergeMode);
            } catch (errWithParams) {
                updateErrors.push(errWithParams)
            }
            return { errors: updateErrors, successfulImports: documents.length };
        }
    }
}

