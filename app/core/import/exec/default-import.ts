import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportErrors} from './import-errors';
import {ImportValidator} from './import-validator';
import {DocumentMerge} from './document-merge';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {ProjectConfiguration} from 'idai-components-2';
import {duplicates, to} from 'tsfun';
import {RelationsCompleter} from './relations-completer';
import {ImportUpdater} from './import-updater';
import {ImportFunction} from './import-function';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


    export function build(validator: ImportValidator,
                          projectConfiguration: ProjectConfiguration,
                          generateId: () => string,
                          mergeMode: boolean = false,
                          allowOverwriteRelationsInMergeMode = false,
                          mainTypeDocumentId: string = '' /* '' => no assignment */,
                          useIdentifiersInRelations: boolean = false): ImportFunction {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }


        /**
         * @param datastore
         * @param username
         * @param documents documents with the field resource.identifier set to a non empty string.
         *   If resource.id is set, it will be taken as document.id on creation.
         *   The relations map is assumed to be at least existent, but can be empty.
         *   The resource.type field may be empty.
         * @param importReport
         *   .errors {ImportError.*}
         *      [PREVALIDATION_DUPLICATE_IDENTIFIER, doc.resource.identifier] if duplicate identifier is found in import file.
         *      [PREVALIDATION_INVALID_TYPE, doc.resource.type]
         *      [PREVALIDATION_OPERATIONS_NOT_ALLOWED]
         *      [PREVALIDATION_NO_OPERATION_ASSIGNED]
         *      [PREVALIDATION_MISSING_RELATION_TARGET] if useIdentifiersInRelations and target of relation not found in db or in importfile
         *      [EXEC_MISSING_RELATION_TARGET]
         *      [INVALID_MAIN_TYPE_DOCUMENT]
         *      [RESOURCE_EXISTS] if resource already exist and !mergeIfExists
         */
        return async (documents: Array<Document>,
                      datastore: DocumentDatastore,
                      username: string): Promise<{ errors: string[][], successfulImports: number }> => {

            if (!mergeMode) {
                const duplicates_ = duplicates(documents.map(to('resource.identifier')));
                if (duplicates_.length > 0) {
                    const errors = [];
                    for (let duplicate of duplicates_) errors.push(
                        [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                    return { errors: errors, successfulImports: 0} ;
                }
            }
            const identifierMap: { [identifier: string]: string } = mergeMode ?
                {}
                : assignIds(documents, generateId);

            const { documentsForUpdate, errors } = await prepareDocumentsForUpdate(
                documents,
                findByIdentifier(datastore),
                identifierMap,
                mergeMode,
                allowOverwriteRelationsInMergeMode,
                validator,
                mainTypeDocumentId,
                useIdentifiersInRelations);

            if (errors.length > 0) return { errors: errors, successfulImports: 0 };

            let targetDocuments;
            try {
                if (!mergeMode || allowOverwriteRelationsInMergeMode) {
                    targetDocuments = await RelationsCompleter.completeInverseRelations(
                        documentsForUpdate as any,
                        (resourceId: string) => datastore.get(resourceId),
                        (propertyName: string) => projectConfiguration.isRelationProperty(propertyName),
                        (propertyName: string) => projectConfiguration.getInverseRelations(propertyName),
                        mergeMode);
                }
            } catch (errWithParams) {
                return { errors: [errWithParams], successfulImports: 0 };
            }

            const updateErrors = [];
            try {
                await ImportUpdater.go(
                    documentsForUpdate as any,
                    targetDocuments,
                    (d: Document, u: string) => datastore.update(d, u),
                    (d: Document, u: string) => datastore.create(d, u),
                    username,
                    mergeMode);

            } catch (errWithParams) {
                updateErrors.push(errWithParams);
            }

            return { errors: updateErrors, successfulImports: documents.length };
        }
    }


    async function prepareDocumentsForUpdate(documents: Array<Document>,
                                             find: (identifier: string) => Promise<Document|undefined>,
                                             identifierMap: { [identifier: string]: string },
                                             mergeMode: boolean,
                                             allowOverwriteRelationsOnMerge: boolean,
                                             validator: ImportValidator,
                                             mainTypeDocumentId: string,
                                             useIdentifiersInRelations: boolean) {

        const errors: string[][] = [];
        const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                if ((!mergeMode || allowOverwriteRelationsOnMerge)  && useIdentifiersInRelations) {
                    await rewriteRelations(document, find, identifierMap);
                }
                const documentForUpdate = await mergeOrUseAsIs(document, find, mergeMode, allowOverwriteRelationsOnMerge);
                await prepareDocumentForUpdate(documentForUpdate, validator, mainTypeDocumentId, mergeMode);
                documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                errors.push(errWithParams);
            }
        }
        return { documentsForUpdate: documentsForUpdate, errors: errors };
    }


    function findByIdentifier(datastore: DocumentDatastore) {

        return async (identifier: string): Promise<Document|undefined> => {

            const result = await datastore.find({ constraints: { 'identifier:match': identifier }});
            return result.totalCount === 1
                ? result.documents[0]
                : undefined;
        }
    }


    /**
     * Generates resource ids of documents in place, for those documents that have none yet
     */
    function assignIds(documents: Array<Document>, generateId: Function) {

        const identifierMap: { [identifier: string]: string } = {};
        for (let document of documents) {
            if (document.resource.id) continue;
            const uuid = generateId();
            document.resource.id = uuid;
            identifierMap[document.resource.identifier] = uuid;
        }
        return identifierMap;
    }


    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  find: (identifier: string) => Promise<Document|undefined>,
                                  mergeIfExists: boolean,
                                  allowOverwriteRelationsOnMerge: boolean): Promise<Document> {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await find(document.resource.identifier);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate, allowOverwriteRelationsOnMerge);
            else throw [ImportErrors.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    /**
     * Rewrites the relations of document in place
     */
    async function rewriteRelations(document: NewDocument,
                                    find: (identifier: string) => Promise<Document|undefined>,
                                    identifierMap: { [identifier: string]: string }) {

        for (let relation of Object.keys(document.resource.relations)) {

            let i = 0;
            for (let identifier of document.resource.relations[relation]) {

                const targetDocFromDB = await find(identifier);
                if (!targetDocFromDB && !identifierMap[identifier]) {
                    throw [ImportErrors.MISSING_RELATION_TARGET, identifier];
                }

                document.resource.relations[relation][i] = targetDocFromDB
                    ? targetDocFromDB.resource.id
                    : identifierMap[identifier];
                i++;
            }
        }
    }


    async function prepareDocumentForUpdate(document: NewDocument,
                                            validator: ImportValidator,
                                            mainTypeDocumentId: string,
                                            mergeIfExists: boolean): Promise<Document|NewDocument> {

        if (!mergeIfExists) {
            validator.assertIsKnownType(document);
            validator.assertIsAllowedType(document, mergeIfExists);
            await prepareIsRecordedInRelation(document, mainTypeDocumentId, validator);
        }
        validator.assertIsWellformed(document);
        return document;
    }


    async function prepareIsRecordedInRelation(document: NewDocument,
                                               mainTypeDocumentId: string,
                                               validator: ImportValidator) {

        if (!mainTypeDocumentId) {
            try {
                validator.assertHasIsRecordedIn(document);
            } catch {
                throw [ImportErrors.NO_OPERATION_ASSIGNED];
            }
        } else {
            await validator.assertIsNotOverviewType(document);
            await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
            initRecordedIn(document, mainTypeDocumentId);
        }
    }


    /**
     * Sets the isRecordedIn to mainTypeDocumentId, operates in place
     */
    async function initRecordedIn(document: NewDocument, mainTypeDocumentId: string) {

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }
}