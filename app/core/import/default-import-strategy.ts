import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {Validator} from '../model/validator';
import {TypeUtility} from '../model/type-utility';
import {ImportErrors} from './import-errors';
import {ImportReport} from './import-facade';
import {duplicates, to} from 'tsfun';
import {RelationsCompleter} from './relations-completer';
import {IdGenerator} from '../datastore/core/id-generator';
import {DefaultImport} from './default-import';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    private idGenerator = new IdGenerator();

    private identifierMap: { [identifier: string]: string } = {};


    constructor(private typeUtility: TypeUtility,
                private validator: Validator,
                private projectConfiguration: ProjectConfiguration,
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
     * @param datastore
     * @param username
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
                        importReport: ImportReport,
                        datastore: DocumentDatastore,
                        username: string): Promise<ImportReport> {

        if (!this.mergeIfExists) {
            const duplicates_ = duplicates(documents.map(to('resource.identifier')));
            if (duplicates_.length > 0) {
                for (let duplicate of duplicates_) importReport.errors.push(
                    [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                return importReport;
            }
        }
        this.identifierMap = this.mergeIfExists ? {} : DefaultImport.assignIds(
            documents, this.idGenerator.generateId.bind(this)); // TODO make idGeneratorProvider

        const documentsForUpdate = await this.prepareDocumentsForUpdate(documents, importReport, datastore);
        if (importReport.errors.length > 0) return importReport;

        await DefaultImport.performDocumentsUpdates(
            documentsForUpdate, importReport, datastore, username, this.mergeIfExists);
        if (importReport.errors.length > 0) return importReport;
        importReport.importedResourcesIds = documentsForUpdate.map(to('resource.id'));

        if (!this.setInverseRelations || this.mergeIfExists) return importReport;
        await this.performRelationsUpdates(
            importReport.importedResourcesIds, importReport, datastore, username);

        return importReport;
    }


    private async performRelationsUpdates(importedResourcesIds: string[],
                                          importReport: ImportReport,
                                          datastore: DocumentDatastore,
                                          username: string) {

        try {

            await RelationsCompleter.completeInverseRelations(
                datastore, this.projectConfiguration, username, importedResourcesIds);

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams);
            try {
                await RelationsCompleter.resetInverseRelations(
                    datastore, this.projectConfiguration, username, importedResourcesIds);
            } catch (e) {
                importReport.errors.push(msgWithParams);
            }
        }
    }


    private async prepareDocumentsForUpdate(documents: Array<Document>,
                                            importReport: ImportReport,
                                            datastore: DocumentDatastore): Promise<Array<NewDocument>> {

        const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                const documentForUpdate = await DefaultImport.prepareDocumentForUpdate(
                    document, datastore, this.validator,
                    this.typeUtility, this.projectConfiguration, this.mainTypeDocumentId,
                    this.useIdentifiersInRelations, this.mergeIfExists, this.identifierMap);
                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }
        }
        return documentsForUpdate;
    }
}