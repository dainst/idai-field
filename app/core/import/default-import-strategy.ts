import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';
import {DocumentMerge} from './document-merge';
import {TypeUtility} from '../model/type-utility';
import {Validations} from '../model/validations';
import {M} from '../../components/m';
import {ImportErrors} from './import-errors';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    constructor(private typeUtility: TypeUtility,
                private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string,
                private mergeIfExists = false,
                private mainTypeDocumentId?: string) {
    }


    /**
     * @returns {Document} the stored document if it has been imported, undefined otherwise
     * @throws errorWithParams
     */
    public async importDoc(document: NewDocument): Promise<Document|undefined> {

        if (this.mainTypeDocumentId) {
            if (!Validations.validateType(document.resource, this.projectConfiguration)) {
                throw [M.IMPORT_VALIDATION_ERROR_INVALID_TYPE, document.resource.type];
            }
            if (this.typeUtility.isSubtype(document.resource.type, 'Operation')) {
                throw [ImportErrors.OPERATIONS_NOT_ALLOWED_ON_IMPORT_TO_OPERATION];
            }
            await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);
        }

        await this.validator.validate(
            document as Document,
            false,
            true,
            this.mergeIfExists);

        const existingDocument = await this.findByIdentifier(document.resource.identifier);
        if (this.mergeIfExists) {

            if (!existingDocument) return undefined;

            const updatedDocument = DocumentMerge.merge(existingDocument, document as Document);
            return await this.datastore.update(updatedDocument as Document, this.username);

        } else {
            if (existingDocument) throw [M.MODEL_VALIDATION_ERROR_IDENTIFIER_EXISTS, existingDocument.resource.identifier];

            // throws if !mergeIfExists and exists
            return await this.datastore.create(document, this.username);
        }
    }


    private async findByIdentifier(identifier: string) {

        const result = await this.datastore.find({ constraints: { 'identifier:match': identifier }});
        if (result.totalCount === 1) return Promise.resolve(result.documents[0]);
        else return undefined;
    }


    private async setMainTypeDocumentRelation(document: NewDocument, mainTypeDocumentId: string): Promise<void> {

        const mainTypeDocument = await this.datastore.get(mainTypeDocumentId);

        if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
                mainTypeDocument.resource.type, 'isRecordedIn')) {

            throw [ImportErrors.INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }
}