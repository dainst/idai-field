import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportErrors} from '../import-errors';
import {ImportValidator} from './import-validator';
import {DocumentMerge} from './document-merge';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {ImportReport} from '../import-facade';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';
import {duplicates, to} from 'tsfun';
import {RelationsCompleter} from './relations-completer';
import {ImportUpdater} from './import-updater';
import {ImportFunction} from '../import-function';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


    export function build(validator: ImportValidator,
        projectConfiguration: ProjectConfiguration,
        mergeMode: boolean,
        generateId: () => string,
        mainTypeDocumentId: string = '' /* '' => no assignment */,
        useIdentifiersInRelations: boolean = false): ImportFunction {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }


        /**
         * TODO validate relations that refer to each other in import file
         *
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
                      importReport: ImportReport,
                      datastore: DocumentDatastore,
                      username: string): Promise<ImportReport> => {

            if (!mergeMode) {
                const duplicates_ = duplicates(documents.map(to('resource.identifier')));
                if (duplicates_.length > 0) {
                    for (let duplicate of duplicates_) importReport.errors.push(
                        [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                    return importReport;
                }
            }
            const identifierMap: { [identifier: string]: string } = mergeMode ?
                {}
                : DefaultImport.assignIds(documents, generateId);

            const documentsForUpdate = await DefaultImport.prepareDocumentsForUpdate(
                documents,
                importReport,
                (identifier: string) => DefaultImport.findByIdentifier(identifier, datastore),
                identifierMap,
                mergeMode,
                validator,
                mainTypeDocumentId,
                useIdentifiersInRelations);

            if (importReport.errors.length > 0) return importReport;

            let targetDocuments;
            if (!mergeMode) targetDocuments = await RelationsCompleter.completeInverseRelations(
                (resourceId: string) => datastore.get(resourceId),
                projectConfiguration,
                documents);

            try {
                await ImportUpdater.go(
                    documentsForUpdate as any,
                    targetDocuments,
                    (d: Document, u: string) => datastore.update(d, u),
                    (d: Document, u: string) => datastore.create(d, u),
                    username,
                    mergeMode);

            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }

            importReport.importedResourcesIds = documents.map(to('resource.id'));
            return importReport;
        }
    }


    export async function prepareDocumentsForUpdate(documents: Array<Document>,
            importReport: ImportReport,
            find: (identifier: string) => Promise<Document|undefined>,
            identifierMap: { [identifier: string]: string },
        mergeMode: boolean,
            validator: ImportValidator,
            mainTypeDocumentId: string,
            useIdentifiersInRelations: boolean): Promise<Array<NewDocument>> {

            const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                if (!mergeMode && useIdentifiersInRelations) {
                    await DefaultImport.rewriteRelations(document, find, identifierMap);
                }
                const documentForUpdate: Document|undefined =
                    await DefaultImport.mergeOrUseAsIs(document, find, mergeMode);

                await DefaultImport.prepareDocumentForUpdate(
                    document, validator, mainTypeDocumentId, mergeMode);

                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }
        }
        return documentsForUpdate;
    }


    export async function findByIdentifier(identifier: string,
                                           datastore: DocumentDatastore): Promise<Document|undefined> {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }


    /**
     * Generates resource ids of documents in place, for those documents that have none yet
     */
    export function assignIds(documents: Array<Document>, generateId: Function) {

        const identifierMap: { [identifier: string]: string } = {};
        for (let document of documents) {
            if (document.resource.id) continue;
            const uuid = generateId();
            document.resource.id = uuid;
            identifierMap[document.resource.identifier] = uuid;
        }
        return identifierMap;
    }


    export async function mergeOrUseAsIs(document: NewDocument|Document,
                                         find: (identifier: string) => Promise<Document|undefined>,
                                         mergeIfExists: boolean) {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await find(document.resource.identifier);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else throw [ImportErrors.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    /**
     * Rewrites the relations of document in place
     */
    export async function rewriteRelations(document: NewDocument,
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


    export async function prepareDocumentForUpdate(document: NewDocument,
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


    async function prepareIsRecordedInRelation(document: NewDocument, mainTypeDocumentId: string, validator: ImportValidator) {

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