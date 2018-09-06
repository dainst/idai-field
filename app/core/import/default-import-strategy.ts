import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';
import {DocumentMerge} from './document-merge';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    constructor(private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string,
                private mergeIfExists = false,
                private mainTypeDocumentId?: string) {
    }


    /**
     * @throws errorWithParams
     */
    public async importDoc(document: NewDocument): Promise<Document|undefined> {

        if (this.mainTypeDocumentId) await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);

        await this.validator.validate(document as Document, false, true);


        const existingDocument = await this.findByIdentifier(document.resource.identifier);
        if (this.mergeIfExists) {

            if (!existingDocument) return undefined;

            const updatedDocument = DocumentMerge.merge(existingDocument, document as Document);
            return await this.datastore.update(updatedDocument as Document, this.username);

        } else {
            if (existingDocument) throw [M.MODEL_VALIDATION_ERROR_IDEXISTS, existingDocument.resource.identifier];

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

            throw [M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }
}