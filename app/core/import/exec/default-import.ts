import {Document, NewDocument, ProjectConfiguration, Relations} from 'idai-components-2';
import {ImportErrors} from './import-errors';
import {ImportValidator} from './import-validator';
import {DocumentMerge} from './document-merge';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {arrayEqual, duplicates, to, isUndefinedOrEmpty} from 'tsfun';
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
         *   .errors of ImportError or Validation Error
         */
        return async (documents: Array<Document>,
                      datastore: DocumentDatastore,
                      username: string): Promise<{ errors: string[][], successfulImports: number }> => {

            const {get, find, getInverseRelation} = neededFunctions(datastore, projectConfiguration);

            let documentsForUpdate: Array<Document> = [];
            let relatedDocuments: Array<Document> = [];
            try {

                documentsForUpdate = await makeDocsForUpdate(
                        documents,
                        validator,
                        mergeMode, allowOverwriteRelationsInMergeMode, useIdentifiersInRelations,
                        find, generateId);

                relatedDocuments = await prepareRelations(
                    documentsForUpdate,
                    validator,
                    mergeMode, allowOverwriteRelationsInMergeMode,
                    getInverseRelation, get,
                    mainTypeDocumentId)

            } catch (errWithParams) { return { errors: [errWithParams], successfulImports: 0 }}

            const updateErrors = [];
            try {
                await ImportUpdater.go(documentsForUpdate, relatedDocuments, datastore, username, mergeMode);
            } catch (errWithParams) { updateErrors.push(errWithParams)}
            return { errors: updateErrors, successfulImports: documents.length };
        }
    }


    async function prepareRelations(documents: Array<Document>,
                                    validator: ImportValidator,
                                    mergeMode: boolean,
                                    allowOverwriteRelationsInMergeMode: boolean,
                                    getInverseRelation: (_: string) => string|undefined,
                                    get: (_: string) => Promise<Document>,
                                    mainTypeDocumentId: string) {

        let relatedDocuments: Array<Document> = [];
        if (!mergeMode) await prepareIsRecordedInRelation(documents, validator, mainTypeDocumentId);
        if (!mergeMode || allowOverwriteRelationsInMergeMode) {
            relatedDocuments = await RelationsCompleter.completeInverseRelations(
                documents,
                get, getInverseRelation,
                mergeMode);
        }

        for (let document of documents) {
            if (!document.resource.relations || !document.resource.relations['liesWithin']) continue;

            for (let liesWithinTargeId of document.resource.relations['liesWithin']) {
                const liesWithinTarget = await get(liesWithinTargeId);
                if (!arrayEqual(liesWithinTarget.resource.relations['isRecordedIn'])(document.resource.relations['isRecordedIn'])) {
                    throw [ImportErrors.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN, document.resource.identifier];
                }
            }
        }
        return relatedDocuments;
    }


    /**
     * Assigns ids if necessary.
     * Rewrites relations in identifiers.
     * Does validations, mostly of structural nature, most of relation validation is done later.
     * Merges with existing documents from db if necessary.
     */
    async function makeDocsForUpdate(documents: Array<Document>,
                                     validator: ImportValidator,
                                     mergeMode: boolean,
                                     allowOverwriteRelationsInMergeMode: boolean,
                                     useIdentifiersInRelations: boolean,
                                     find: (identifier: string) => Promise<Document|undefined>,
                                     generateId: () => string): Promise<Array<Document>> {

        const duplicates_ = duplicates(documents.map(to('resource.identifier')));
        if (duplicates_.length > 0) throw [ImportErrors.DUPLICATE_IDENTIFIER, duplicates_[0]];

        const identifierMap = mergeMode ? {} : assignIds(documents, generateId);

        const documentsForUpdate: Array<Document> = [];
        for (let document of documents) {

            if ((!mergeMode || allowOverwriteRelationsInMergeMode)  && useIdentifiersInRelations) {
                removeSelfReferencingIdentifiers(document.resource.relations, document.resource.identifier);
                await rewriteIdentifiersInRelations(document, find, identifierMap);
            }

            const documentForUpdate = await mergeOrUseAsIs(document, find, mergeMode, allowOverwriteRelationsInMergeMode);
            if (!mergeMode) {
                validator.assertIsKnownType(document);
                validator.assertIsAllowedType(document, mergeMode);
            }
            validator.assertIsWellformed(document);
            documentsForUpdate.push(documentForUpdate);
        }
        return documentsForUpdate;
    }


    function removeSelfReferencingIdentifiers(relations: Relations|undefined, resourceIdentifier: string) {

        if (!relations) return;
        for (let relName of Object.keys(relations)) {
            relations[relName] = relations[relName]
                .filter(relTarget => relTarget !== resourceIdentifier);
            if (isUndefinedOrEmpty(relations[relName])) delete relations[relName];
        }
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
    async function rewriteIdentifiersInRelations(document: NewDocument,
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


    async function prepareIsRecordedInRelation(documentsForUpdate: Array<NewDocument>,
                                               validator: ImportValidator,
                                               mainTypeDocumentId: string) {

        for (let document of documentsForUpdate) {
            if (!mainTypeDocumentId) {
                try { validator.assertHasIsRecordedIn(document) }
                catch { throw [ImportErrors.NO_OPERATION_ASSIGNED] }
            } else {
                await validator.assertIsNotOverviewType(document);
                await validator.isRecordedInTargetAllowedRelationDomainType(document, mainTypeDocumentId);
                initRecordedIn(document, mainTypeDocumentId);
            }
        }
    }


    function initRecordedIn(document: NewDocument, mainTypeDocumentId: string) {

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }


    function neededFunctions(datastore: DocumentDatastore, projectConfiguration: ProjectConfiguration) {

        return {
            get: (resourceId: string) => datastore.get(resourceId),
            find: findByIdentifier(datastore),
            getInverseRelation: (propertyName: string) => projectConfiguration.getInverseRelations(propertyName)
        };
    }
}