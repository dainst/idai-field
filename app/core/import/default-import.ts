import {DocumentDatastore} from '../datastore/document-datastore';
import {Document} from 'idai-components-2/src/model/core/document';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportErrors} from './import-errors';
import {ProjectConfiguration} from 'idai-components-2';
import {Validator} from '../model/validator';
import {Validations} from '../model/validations';
import {ValidationErrors} from '../model/validation-errors';
import {ImportValidation} from './import-validation';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module DefaultImport {


    export async function prepareDocumentForUpdate(document: NewDocument,
                                                   datastore: DocumentDatastore,
                                                   validator: Validator,
                                                   projectConfiguration: ProjectConfiguration,
                                                   mainTypeDocumentId: string,
                                                   mergeIfExists: boolean): Promise<Document|NewDocument> {

        if (!mergeIfExists) {
            assertIsKnownType(document, projectConfiguration);
            await prepareIsRecordedInRelation(
                document, mainTypeDocumentId, datastore, validator, projectConfiguration);
        }

        ImportValidation.assertIsWellformed(document, projectConfiguration);
        return document;
    }


    async function prepareIsRecordedInRelation(document: NewDocument,
                                               mainTypeDocumentId: string,
                                               datastore: DocumentDatastore,
                                               validator: Validator,
                                               projectConfiguration: ProjectConfiguration) {

        if (!mainTypeDocumentId) {
            try {
                validator.assertHasIsRecordedIn(document);
            } catch {
                throw [ImportErrors.NO_OPERATION_ASSIGNED];
            }
        } else {
            await validator.assertIsNotOverviewType(document);
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


    /**
     * @throws [INVALID_TYPE]
     */
    function assertIsKnownType(document: Document|NewDocument, projectConfiguration: ProjectConfiguration) {

        if (!Validations.validateType(document.resource, projectConfiguration)) {
            throw [ValidationErrors.INVALID_TYPE, document.resource.type];
        }
    }
}