import {to} from 'tsfun';
import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {ImportReport} from './import-facade';
import {Document} from 'idai-components-2/src/model/core/document';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportUpdater { // TODO change to batch updates and rename to BatchUpdater


    export async function performUpdates(documents: Array<Document>,
                                  targetDocuments: Array<Document>|undefined,
                                  update: (document: Document, username: string) => Promise<Document>,
                                  create: (document: Document, username: string) => Promise<Document>,
                                  username: string,
                                  useUpdateMethod: boolean /* else new doc, then use create */,
                                  importReport: ImportReport /* TODO remove from this interface */) {

        await performDocumentsUpdates(documents, update, create, username, useUpdateMethod, importReport);

        if (importReport.errors.length > 0) return importReport;
        importReport.importedResourcesIds = documents.map(to('resource.id'));

        if (!targetDocuments) return importReport;
        await performRelationsUpdates(targetDocuments, update, username, importReport);
    }


    async function performDocumentsUpdates(documentsForUpdate: Array<NewDocument>,
                                           update: (document: Document, username: string) => Promise<Document>,
                                           create: (document: Document, username: string) => Promise<Document>,
                                           username: string,
                                           updateMode: boolean,
                                           importReport: ImportReport): Promise<void> {

        try {
            for (let documentForUpdate of documentsForUpdate) {

                updateMode
                    ? await update(documentForUpdate as Document, username)
                    : await create(documentForUpdate as Document, username); // throws if exists
            }
        } catch (errWithParams) {

            importReport.errors.push(errWithParams);
        }
    }


    async function performRelationsUpdates(targetDocuments: Array<Document>,
                                           update: (document: Document, username: string) => Promise<Document>,
                                           username: string,
                                           importReport: ImportReport): Promise<void> {

        try {

            for (let targetDocument of targetDocuments) await update(targetDocument, username);

        } catch (msgWithParams) {

            importReport.errors.push(msgWithParams);
        }
    }
}