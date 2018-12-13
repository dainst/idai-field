import {Document, NewDocument, ProjectConfiguration} from 'idai-components-2';
import {ImportStrategy} from './import-strategy';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ImportErrors} from './import-errors';
import {ImportReport} from './import-facade';
import {duplicates, to} from 'tsfun';
import {DefaultImport} from './default-import';
import {DocumentMerge} from './document-merge';
import {RelationsCompleter} from './relations-completer';
import {ImportValidator} from './import-validator';
import {ImportUpdater} from './import-updater';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DefaultImportStrategy implements ImportStrategy {


    private identifierMap: { [identifier: string]: string } = {};


    constructor(private validator: ImportValidator,
                private projectConfiguration: ProjectConfiguration,
                private mergeIfExists: boolean,
                private useIdentifiersInRelations: boolean,
                private setInverseRelations: boolean, // TODO check if we can get rid of this
                private generateId: () => string,
                private mainTypeDocumentId: string = '' /* '' => no assignment */
                ) {

        if (mainTypeDocumentId && mergeIfExists) {
            throw 'FATAL ERROR - illegal argument combination - mainTypeDocumentId and mergeIfExists must not be both truthy';
        }
    }


    /**
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

        if (!this.mergeIfExists) {
            const duplicates_ = duplicates(documents.map(to('resource.identifier')));
            if (duplicates_.length > 0) {
                for (let duplicate of duplicates_) importReport.errors.push(
                    [ImportErrors.DUPLICATE_IDENTIFIER, duplicate]);
                return importReport;
            }
        }
        this.identifierMap = this.mergeIfExists ? {} : DefaultImportStrategy.assignIds(
            documents, this.generateId);

        const documentsForUpdate = await this.prepareDocumentsForUpdate(documents, importReport, datastore);
        if (importReport.errors.length > 0) return importReport;

        let targetDocuments;
        if (this.setInverseRelations && !this.mergeIfExists) targetDocuments = await RelationsCompleter.completeInverseRelations(
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
                this.mergeIfExists);

        } catch (errWithParams) {
            importReport.errors.push(errWithParams);
        }

        return importReport;
    }


    private async prepareDocumentsForUpdate(documents: Array<Document>,
                                            importReport: ImportReport,
                                            datastore: DocumentDatastore): Promise<Array<NewDocument>> {

        const documentsForUpdate: Array<NewDocument> = [];
        for (let document of documents) {

            try {
                if (!this.mergeIfExists && this.useIdentifiersInRelations) {
                    await DefaultImportStrategy.rewriteRelations(document, this.identifierMap, datastore);
                }
                const documentForUpdate: Document|undefined =
                    await DefaultImportStrategy.mergeOrUseAsIs(document, datastore, this.mergeIfExists);

                await DefaultImport.prepareDocumentForUpdate(
                    document, this.validator, this.mainTypeDocumentId, this.mergeIfExists);

                if (documentForUpdate) documentsForUpdate.push(documentForUpdate);
            } catch (errWithParams) {
                importReport.errors.push(errWithParams);
            }
        }
        return documentsForUpdate;
    }


    private static async mergeOrUseAsIs(document: NewDocument|Document,
                                        datastore: DocumentDatastore,
                                        mergeIfExists: boolean) {

        let documentForUpdate: Document = document as Document;
        const existingDocument = await DefaultImportStrategy.findByIdentifier(document.resource.identifier, datastore);
        if (mergeIfExists) {
            if (existingDocument) documentForUpdate = DocumentMerge.merge(existingDocument, documentForUpdate);
            else throw [ImportErrors.UPDATE_TARGET_NOT_FOUND, document.resource.identifier];
        } else {
            if (existingDocument) throw [ImportErrors.RESOURCE_EXISTS, existingDocument.resource.identifier];
        }
        return documentForUpdate;
    }


    /**
     * Rewrites the relations of document in place
     */
    private static async rewriteRelations(document: NewDocument,
                                    identifierMap: { [identifier: string]: string },
                                    datastore: DocumentDatastore) {

        for (let relation of Object.keys(document.resource.relations)) {

            let i = 0;
            for (let identifier of document.resource.relations[relation]) {

                const targetDocFromDB = await DefaultImportStrategy.findByIdentifier(identifier, datastore);
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


    private static async findByIdentifier(identifier: string, datastore: DocumentDatastore): Promise<Document|undefined> {

        const result = await datastore.find({ constraints: { 'identifier:match': identifier }});
        return result.totalCount === 1
            ? result.documents[0]
            : undefined;
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
}