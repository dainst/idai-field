import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportErrors} from './import-errors';
import {ImportValidator} from './import-validator';
import {DocumentMerge} from './document-merge';
import {DocumentDatastore} from '../datastore/document-datastore';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


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