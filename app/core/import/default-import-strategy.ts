import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Validator} from '../model/validator';
import {DocumentMerge} from './document-merge';
import {TypeUtility} from '../model/type-utility';
import {Validations} from '../model/validations';
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
                private mainTypeDocumentId: string, /* '' => no assignment */
                private mergeIfExists: boolean
                ) {

        if (mainTypeDocumentId && mergeIfExists) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
    }


    /**
     * Some quick checks which do not query the db (much)
     *
     * @param docsToImport with resource.identifier set
     * @returns [[ImportErrors.INVALID_TYPE, doc.resource.type]]
     * @returns [[ImportErrors.PREVALIDATION_OPERATIONS_NOT_ALLOWED]]
     * @returns [[ImportErrors.PREVALIDATION_NO_OPERATION_ASSIGNED]]
     */
    public async preValidate(docsToImport: Array<Document>): Promise<any[]> {

        if (this.mergeIfExists) return [];

        const identifiersInDocsToImport: string[] = [];
        for (let doc of docsToImport) {

            if (!doc.resource.identifier) throw 'FATAL ERROR - illegal argument - document without identifier';
            if (identifiersInDocsToImport.includes(doc.resource.identifier)) {
                return [[ImportErrors.PREVALIDATION_DUPLICATE_IDENTIFIER, doc.resource.identifier]];
            }
            identifiersInDocsToImport.push(doc.resource.identifier);


            // TODO write test
            // should not take long since it accesses indexer and should return undefined normally
            const existingDocument = await this.findByIdentifier(doc.resource.identifier);
            if (existingDocument) return [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];

            if (!Validations.validateType(doc.resource, this.projectConfiguration)) {
                return [[ImportErrors.PREVALIDATION_INVALID_TYPE, doc.resource.type]];
            }

            if (this.mainTypeDocumentId) {
                if (this.typeUtility.isSubtype(doc.resource.type, 'Operation')) {
                    return [[ImportErrors.PREVALIDATION_OPERATIONS_NOT_ALLOWED]];
                }
            } else {
                if (doc.resource.type !== 'Place' && !this.typeUtility.isSubtype(doc.resource.type, 'Operation')) {
                    if (!doc.resource.relations || !doc.resource.relations['isRecordedIn']) {
                        return [[ImportErrors.PREVALIDATION_NO_OPERATION_ASSIGNED]];
                    }
                }
            }
        }

        return [];
    }


    /**
     * @returns {Document} the stored document if it has been imported, undefined otherwise
     * @throws errorWithParams
     * @throws [RESOURCE_EXISTS] if resource already exist and !mergeIfExists
     * @throws [INVALID_MAIN_TYPE_DOCUMENT]
     */
    public async importDoc(document: NewDocument): Promise<Document|undefined> {

        if (this.mainTypeDocumentId) await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);

        let documentForUpdate: Document = document as Document;
        if (this.mergeIfExists) {
            const existingDocument = await this.findByIdentifier(document.resource.identifier);
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else return undefined;
        }

        await this.validator.validate(
            documentForUpdate,
            false,
            true,
            this.mergeIfExists);

        return this.mergeIfExists
            ? await this.datastore.update(documentForUpdate, this.username)
            : await this.datastore.create(documentForUpdate, this.username); // throws if exists
    }


    private async findByIdentifier(identifier: string) {

        const result = await this.datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
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