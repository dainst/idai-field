import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Validator} from '../model/validator';
import {DocumentMerge} from './document-merge';
import {TypeUtility} from '../model/type-utility';
import {ImportErrors} from './import-errors';
import {ImportReport} from './import-facade';
import {duplicates, to} from 'tsfun';
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
     *
     * @param documents documents with the field resource.identifier set to a non empty string
     *   if resource.id is set, it will be taken as document.id on creation
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
    public async import(documents: Array<Document>,
                        importReport: ImportReport): Promise<ImportReport> {

        if (!this.mergeIfExists) {
            const duplicates_ = duplicates(documents.map(to('resource.identifier')));
            if (duplicates_.length > 0) {
                for (let duplicate of duplicates_) importReport.errors.push(
                    [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                return importReport;
            }
        }
        this.identifierMap = this.mergeIfExists ? {} : DefaultImportStrategy.assignIds(
            documents, this.idGenerator.generateId.bind(this)); // TODO make idGeneratorProvider

        const documentsForUpdate = await this.prepareDocumentsForUpdate(documents, importReport);
        if (importReport.errors.length > 0) return importReport;

        await this.performDocumentsUpdates(documentsForUpdate, importReport, this.username, this.mergeIfExists);
        if (importReport.errors.length > 0) return importReport;
        importReport.importedResourcesIds = documentsForUpdate.map(to('resource.id'));

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
                                          updateExisting: boolean /* else new docs */) {

        try {
            for (let documentForUpdate of documentsForUpdate) { // TODO perform batch updates

                updateExisting
                    ? await this.datastore.update(documentForUpdate as Document, username)
                    : await this.datastore.create(documentForUpdate as Document, username); // throws if exists
            }
        } catch (errWithParams) {

            importReport.errors.push(errWithParams);
        }
    }


    private async prepareDocumentsForUpdate(documents: Array<Document>,
                                            importReport: ImportReport): Promise<Array<NewDocument>> {

        const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                const documentForUpdate = await this.prepareDocumentForUpdate(document);
                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }
        }
        return documentsForUpdate;
    }


    /**
     * @returns undefined if should be ignored, document if should be updated
     */
    private async prepareDocumentForUpdate(document: NewDocument): Promise<Document|undefined> {

        if (this.useIdentifiersInRelations) {
            await DefaultImportStrategy.rewriteRelations(document,
                this.identifierMap, this.findByIdentifier.bind(this));
        }

        if (!this.mergeIfExists) {
            this.validator.assertIsKnownType(document);
            await this.prepareIsRecordedInRelation(document, this.mainTypeDocumentId);
        }

        const documentForUpdate: Document|undefined = await this.mergeOrUseAsIs(document, this.mergeIfExists);
        if (!documentForUpdate) return undefined;

        this.validator.assertIsWellformed(documentForUpdate);
        return documentForUpdate;
    }


    private async prepareIsRecordedInRelation(document: NewDocument, mainTypeDocumentId: string) {

        if (!mainTypeDocumentId) {
            try {
                this.validator.assertHasIsRecordedIn(document);
            } catch {
                throw [ImportErrors.NO_OPERATION_ASSIGNED];
            }
        } else {
            await this.assertSettingIsRecordedInIsPermissibleForType(document);
            await this.isRecordedInTargetAllowedRelationDomainType(document);
            DefaultImportStrategy.initRecordedIn(document, mainTypeDocumentId);
        }
    }


    private async mergeOrUseAsIs(document: NewDocument|Document, mergeIfExists: boolean) {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await this.findByIdentifier(document.resource.identifier);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else return undefined;
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    private async assertSettingIsRecordedInIsPermissibleForType(document: Document|NewDocument) { // TODO extract to custom validator for import package, remove dependency to typeUtility then

        this.validator.assertIsKnownType(document); // TODO this seems to be duplicated now, remove it

        if (this.typeUtility.isSubtype(document.resource.type, 'Operation')
            || document.resource.type === 'Place') {

            throw [ImportErrors.OPERATIONS_NOT_ALLOWED];
        }
    }


    private async isRecordedInTargetAllowedRelationDomainType(document: NewDocument) {

        const mainTypeDocument = await this.datastore.get(this.mainTypeDocumentId);
        if (!this.projectConfiguration.isAllowedRelationDomainType(document.resource.type,
            mainTypeDocument.resource.type, 'isRecordedIn')) {

            throw [ImportErrors.INVALID_MAIN_TYPE_DOCUMENT, document.resource.type,
                mainTypeDocument.resource.type];
        }
    }


    private async findByIdentifier(identifier: string): Promise<Document|undefined> {

        const result = await this.datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
    }


    /**
     * Sets the isRecordedIn to mainTypeDocumentId, operates in place
     */
    private static initRecordedIn(document: NewDocument, mainTypeDocumentId: string) {

        const relations = document.resource.relations;
        if (!relations['isRecordedIn']) relations['isRecordedIn'] = [];
        if (!relations['isRecordedIn'].includes(mainTypeDocumentId)) {
            relations['isRecordedIn'].push(mainTypeDocumentId);
        }
    }


    /**
     * Generates resource ids of documents in place, for those documents that have none yet
     */
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
}