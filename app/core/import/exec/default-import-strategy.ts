import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {ImportErrors} from '../import-errors';
import {ImportReport} from '../import-facade';
import {duplicates, to} from 'tsfun';
import {DefaultImport} from './default-import';
import {RelationsCompleter} from './relations-completer';
import {ImportValidator} from './import-validator';
import {ImportUpdater} from './import-updater';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    constructor(private validator: ImportValidator,
                private projectConfiguration: ProjectConfiguration,
                private mergeMode: boolean,
                private generateId: () => string,
                private mainTypeDocumentId: string = '' /* '' => no assignment */,
                private useIdentifiersInRelations: boolean = false) {

        if (mainTypeDocumentId && mergeMode) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
    }


    /**
     * TODO validate relations that refer to each other in import file
     *
     * @param datastore
     * @param username
     * @param documents documents with the field resource.identifier set to a non empty string.
     *   If resource.id is set, it will be taken as document.id on creation.
     *   The relations map is assumed to be at least existent, but can be empty.
     *   The resource.type field may be empty.
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

        if (!this.mergeMode) {
            const duplicates_ = duplicates(documents.map(to('resource.identifier')));
            if (duplicates_.length > 0) {
                for (let duplicate of duplicates_) importReport.errors.push(
                    [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                return importReport;
            }
        }
        const identifierMap: { [identifier: string]: string } = this.mergeMode ?
            {}
            : DefaultImport.assignIds(documents, this.generateId);

        const documentsForUpdate = await this.prepareDocumentsForUpdate(
            documents,
            importReport,
            (identifier: string) => DefaultImport.findByIdentifier(identifier, datastore),
            identifierMap);

        if (importReport.errors.length > 0) return importReport;

        let targetDocuments;
        if (!this.mergeMode) targetDocuments = await RelationsCompleter.completeInverseRelations(
            (resourceId: string) => datastore.get(resourceId),
            this.projectConfiguration,
            documents);

        try {
            await ImportUpdater.go(
                documentsForUpdate as any,
                targetDocuments,
                (d: Document, u: string) => datastore.update(d, u),
                (d: Document, u: string) => datastore.create(d, u),
                username,
                this.mergeMode);

        } catch (errWithParams) {
            importReport.errors.push(errWithParams);
        }

        importReport.importedResourcesIds = documents.map(to('resource.id'));
        return importReport;
    }


    private async prepareDocumentsForUpdate(documents: Array<Document>,
                                            importReport: ImportReport,
                                            find: (identifier: string) => Promise<Document|undefined>,
                                            identifierMap: { [identifier: string]: string }): Promise<Array<NewDocument>> {

        const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                if (!this.mergeMode && this.useIdentifiersInRelations) {
                    await DefaultImport.rewriteRelations(document, find, identifierMap);
                }
                const documentForUpdate: Document|undefined =
                    await DefaultImport.mergeOrUseAsIs(document, find, this.mergeMode);

                await DefaultImport.prepareDocumentForUpdate(
                    document, this.validator, this.mainTypeDocumentId, this.mergeMode);

                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }
        }
        return documentsForUpdate;
    }
}