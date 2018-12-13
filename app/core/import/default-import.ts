import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportErrors} from './import-errors';
import {ImportValidator} from './import-validator';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


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