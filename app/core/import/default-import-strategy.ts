import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {M} from '../../m';
import {DocumentDatastore} from "../datastore/document-datastore";
import {Validator} from '../model/validator';

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
    public async importDoc(document: NewDocument): Promise<Document> {

        if (this.mainTypeDocumentId) await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);

        let exists = false;
        try {
            await this.validator.validate(document as Document);
        } catch (e) {
            if (this.mergeIfExists && // TODO test this
                e && e.length > 0 && e[0] === M.MODEL_VALIDATION_ERROR_IDEXISTS) exists = true;
            else throw e;
        }

        if (exists && this.mergeIfExists) {
            // TODO merge documents generically
            const existingDocument = await this.findByIdentifier(document.resource.identifier);
            existingDocument.resource.shortDescription = document.resource.shortDescription;
            return await this.datastore.update(existingDocument as Document, this.username);
        } else {
            // throws if !mergeIfExists and exists
            return await this.datastore.create(document, this.username);
        }
    }


    private findByIdentifier(identifier: string) {

        return this.datastore.find({ constraints: { 'identifier:match': identifier }})
            .then(result => {
                if (result.totalCount === 1) return Promise.resolve(result.documents[0]);
                else throw "not found";
            }).catch(() => Promise.reject([M.ALL_FIND_ERROR]));
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