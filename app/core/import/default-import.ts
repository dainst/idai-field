import {DocumentDatastore} from '../datastore/document-datastore';
import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {DocumentMerge} from './document-merge';
import {ImportErrors} from './import-errors';
import {ImportReport} from './import-facade';
import {ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../model/validator';
import {TypeUtility} from '../model/type-utility';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


    export async function performDocumentsUpdates(documentsForUpdate: Array<NewDocument>,
                                                  importReport: ImportReport,
                                                  datastore: DocumentDatastore,
                                                  username: string,
                                                  updateExisting: boolean /* else new docs */) {

        try {
            for (let documentForUpdate of documentsForUpdate) { // TODO perform batch updates

                updateExisting
                    ? await datastore.update(documentForUpdate as Document, username)
                    : await datastore.create(documentForUpdate as Document, username); // throws if exists
            }
        } catch (errWithParams) {

            importReport.errors.push(errWithParams);
        }
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


    /**
     * @returns undefined if should be ignored, document if should be updated
     */
    export async function prepareDocumentForUpdate(document: NewDocument,
                                                   datastore: DocumentDatastore,
                                                   validator: Validator,
                                                   typeUtility: TypeUtility,
                                                   projectConfiguration: ProjectConfiguration,
                                                   mainTypeDocumentId: string,
                                                   useIdentifiersInRelations: boolean,
                                                   mergeIfExists: boolean,
                                                   identifierMap: { [identifier: string]: string }
        ): Promise<Document|undefined> {

            if (useIdentifiersInRelations) {
                await rewriteRelations(document, identifierMap, datastore);
            }

            if (!mergeIfExists) {
            validator.assertIsKnownType(document);
            await prepareIsRecordedInRelation(
                document, mainTypeDocumentId, datastore, validator, typeUtility, projectConfiguration);
        }

        const documentForUpdate: Document|undefined = await mergeOrUseAsIs(document, datastore, mergeIfExists);
        if (!documentForUpdate) return undefined;

        validator.assertIsWellformed(documentForUpdate);
        return documentForUpdate;
    }


    async function prepareIsRecordedInRelation(document: NewDocument,
                                               mainTypeDocumentId: string,
                                               datastore: DocumentDatastore,
                                               validator: Validator,
                                               typeUtility: TypeUtility,
                                               projectConfiguration: ProjectConfiguration) {

        if (!mainTypeDocumentId) {
            try {
                validator.assertHasIsRecordedIn(document);
            } catch {
                throw [ImportErrors.NO_OPERATION_ASSIGNED];
            }
        } else {
            await assertSettingIsRecordedInIsPermissibleForType(document, typeUtility);
            await isRecordedInTargetAllowedRelationDomainType(
                document, datastore, projectConfiguration, mainTypeDocumentId);
            initRecordedIn(document, mainTypeDocumentId);
        }
    }


    async function isRecordedInTargetAllowedRelationDomainType(document: NewDocument,
                                                               datastore: DocumentDatastore,
                                                               projectConfiguration: ProjectConfiguration,
                                                               mainTypeDocumentId: string) {

        const mainTypeDocument = await datastore.get(mainTypeDocumentId);
        if (!projectConfiguration.isAllowedRelationDomainType(document.resource.type,
            mainTypeDocument.resource.type, 'isRecordedIn')) {

            throw [ImportErrors.INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }
    }


    async function assertSettingIsRecordedInIsPermissibleForType(document: Document|NewDocument,
                                                                 typeUtility: TypeUtility) {

        if (typeUtility.isSubtype(document.resource.type, 'Operation')
            || document.resource.type === 'Place') {

            throw [ImportErrors.OPERATIONS_NOT_ALLOWED];
        }
    }



    async function mergeOrUseAsIs(document: NewDocument|Document,
                                  datastore: DocumentDatastore,
                                  mergeIfExists: boolean) {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await findByIdentifier(document.resource.identifier, datastore);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else return undefined;
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    /**
     * Rewrites the relations of document in place
     */
    async function rewriteRelations(document: NewDocument,
                                    identifierMap: { [identifier: string]: string },
                                    datastore: DocumentDatastore) {

        for (let relation of Object.keys(document.resource.relations)) {

            let i = 0;
            for (let identifier of document.resource.relations[relation]) {

                const targetDocFromDB = await findByIdentifier(identifier, datastore);
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


    async function findByIdentifier(identifier: string, datastore: DocumentDatastore): Promise<Document|undefined> {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
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