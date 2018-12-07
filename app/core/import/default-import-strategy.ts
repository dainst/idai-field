import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Validator} from '../model/validator';
import {DocumentMerge} from './document-merge';
import {TypeUtility} from '../model/type-utility';
import {Validations} from '../model/validations';
import {ImportErrors} from './import-errors';
import {ImportReport} from './import-facade';
import {duplicates} from 'tsfun';
import {RelationsCompleter} from './relations-completer';
import {IdGenerator} from '../datastore/core/id-generator';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    private idGenerator = new IdGenerator();

    private identifierMap: { [identifier: string]: string } = {};


    constructor(private typeUtility: TypeUtility,
                private validator: Validator,
                private datastore: DocumentDatastore,
                private projectConfiguration: ProjectConfiguration,
                private username: string,
                private mainTypeDocumentId: string, /* '' => no assignment */
                private mergeIfExists: boolean,
                private useIdentifiersInRelations: boolean,
                private setInverseRelations: boolean
                ) {

        if (mainTypeDocumentId && mergeIfExists) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
    }


    /**
     * TODO implement rollback, throw exec rollback error if it goes wrong
     * TODO throw error if user specifies id
     * TODO we could remove the datastore feature of predefining ids entirely
     *
     * @param documents documents with the field resource.identifier set to a non empty string
     * @param importReport
     *   .errors
     *      [ImportErrors.PREVALIDATION_DUPLICATE_IDENTIFIER, doc.resource.identifier] if duplicate identifier is found in import file. only first occurence is listed // TODO return all and let importer do the rest
     *      [ImportErrors.PREVALIDATION_INVALID_TYPE, doc.resource.type]
     *      [ImportErrors.PREVALIDATION_OPERATIONS_NOT_ALLOWED]
     *      [ImportErrors.PREVALIDATION_NO_OPERATION_ASSIGNED]
     *      [ImportErrors.EXEC_MISSING_RELATION_TARGET]
     */
    public async import(documents: Array<Document>,
                        importReport: ImportReport): Promise<ImportReport> {

        if (!this.mergeIfExists) {
            const duplicates_ = duplicates(documents.map(doc => doc.resource.identifier));
            if (duplicates_.length > 0) {
                importReport.errors = [[ImportErrors.PREVALIDATION_DUPLICATE_IDENTIFIER, duplicates_[0]]];
                return importReport;
            }
        }
        this.identifierMap = this.mergeIfExists ? {} : DefaultImportStrategy.assignIds(documents, this.idGenerator.generateId.bind(this));

        const documentsForUpdate = await this.prepareDocumentsForUpdate(documents, importReport);
        if (importReport.errors.length > 0) return importReport;

        await this.performDocumentsUpdates(documentsForUpdate, importReport, this.username, this.mergeIfExists);
        if (importReport.errors.length > 0) return importReport;

        if (!this.setInverseRelations || this.mergeIfExists) return importReport;
        await this.performRelationsUpdates(importReport.importedResourcesIds, importReport);

        return importReport;
    }


    private async performRelationsUpdates(importedResourcesIds: string[], importReport: ImportReport) {

        try {

            await RelationsCompleter.completeInverseRelations(
                this.datastore, this.projectConfiguration, this.username, importedResourcesIds);

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams);
            try {
                await RelationsCompleter.resetInverseRelations(
                    this.datastore, this.projectConfiguration, this.username, importedResourcesIds);
            } catch (e) {
                importReport.errors.push(msgWithParams);
            }
        }
    }


    private async performDocumentsUpdates(documentsForUpdate: Array<NewDocument>,
                                          importReport: ImportReport,
                                          username: string,
                                          mergeIfExists: boolean) {

        try {
            for (let documentForUpdate of documentsForUpdate) { // TODO perform batch updates

                const updatedDocument = mergeIfExists
                    ? await this.datastore.update(documentForUpdate as Document, username)
                    : await this.datastore.create(documentForUpdate as Document, username); // throws if exists
                importReport.importedResourcesIds.push(updatedDocument.resource.id);
            }
        } catch (errWithParams) {

            importReport.errors.push(errWithParams);
        }
    }


    private async prepareDocumentsForUpdate(documents: Array<Document>, importReport: ImportReport): Promise<Array<NewDocument>> {

        const documentsForUpdate: Array<NewDocument> = [];
        try {
            for (let document of documents) {

                const documentForUpdate = await this.prepareDocumentForUpdate(document);
                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            }
        } catch (errWithParams) {
            importReport.errors.push(errWithParams);
        }
        return documentsForUpdate;
    }


    /**
     * @returns {Document} the stored document if it has been imported, undefined otherwise
     * @throws errorWithParams
     * @throws [RESOURCE_EXISTS] if resource already exist and !mergeIfExists
     * @throws [INVALID_MAIN_TYPE_DOCUMENT]
     */
    private async prepareDocumentForUpdate(document: NewDocument): Promise<Document|undefined> {

        await DefaultImportStrategy.validateType(document as Document, this.mainTypeDocumentId, this.mergeIfExists, this.projectConfiguration, this.typeUtility.isSubtype.bind(this));

        if (this.useIdentifiersInRelations) await DefaultImportStrategy.rewriteRelations(document, this.identifierMap, this.findByIdentifier.bind(this));
        if (this.mainTypeDocumentId) await this.setMainTypeDocumentRelation(document, this.mainTypeDocumentId);


        let documentForUpdate: Document = document as Document;
        const existingDocument = await this.findByIdentifier(document.resource.identifier);
        if (this.mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else return undefined;
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }

        await this.validator.validate( // TODO with so many suppressions, we should think about if we make more public methods and call them directly
            documentForUpdate,
            false,
            true,
            this.mergeIfExists,
            !this.mergeIfExists);

        return documentForUpdate;
    }


    private async findByIdentifier(identifier: string) {

        const result = await this.datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }


    // TODO make static
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



    private static assignIds(documents: Array<Document>, generateId: Function) {

        const identifierMap: { [identifier: string]: string } = {};
        for (let document of documents) {
            if (document.resource.id) continue;
            const uuid = generateId();
            document.resource.id = uuid;
            identifierMap[document.resource.identifier] = uuid;
        }
        return identifierMap;
    }



    private static validateType(doc: NewDocument,
                                mainTypeDocumentId: string,
                                mergeIfExists: boolean,
                                projectConfiguration: ProjectConfiguration,
                                isSubtype: Function) {

        if ((!mergeIfExists || doc.resource.type) && !Validations.validateType(doc.resource, projectConfiguration)) {
            throw [ImportErrors.PREVALIDATION_INVALID_TYPE, doc.resource.type];
        }

        if (isSubtype(doc.resource.type, 'Operation') || doc.resource.type === 'Place') {
            if (mainTypeDocumentId) throw [ImportErrors.PREVALIDATION_OPERATIONS_NOT_ALLOWED];
        } else {
            if (!mergeIfExists && !mainTypeDocumentId && (!doc.resource.relations || !doc.resource.relations['isRecordedIn'])) {
                throw [ImportErrors.PREVALIDATION_NO_OPERATION_ASSIGNED]; // TODO also return if no target
            }
        }
    }


    /**
     * Rewrites the relations of document in place
     */
    private static async rewriteRelations(document: NewDocument,
                                          identifierMap: { [identifier: string]: string },
                                          findByIdentifier: Function) {

        for (let relation of Object.keys(document.resource.relations)) {
            let i = 0;
            for (let identifier of document.resource.relations[relation]) {

                const targetDocFromDB = await findByIdentifier(identifier);
                if (!targetDocFromDB && !identifierMap[identifier]) throw [ImportErrors.EXEC_MISSING_RELATION_TARGET, identifier]; // TODO use other message or do it in conversion. this one talks about ID instead identifier

                document.resource.relations[relation][i] = targetDocFromDB ? targetDocFromDB.resource.id : identifierMap[identifier];
                i++;
            }
        }
    }
}