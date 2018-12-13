import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {Document} from 'idai-components-2/src/model/core/document';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportUpdater { // TODO change to batch updates and rename to BatchUpdater


    export async function go(documents: Array<Document>,
                             targetDocuments: Array<Document>|undefined,
                             update: (document: Document, username: string) => Promise<Document>,
                             create: (document: Document, username: string) => Promise<Document>,
                             username: string,
                             useUpdateMethod: boolean /* else new doc, then use create */) {

        await performDocumentsUpdates(documents, update, create, username, useUpdateMethod);
        if (targetDocuments) await performRelationsUpdates(targetDocuments, update, username);
    }


    async function performDocumentsUpdates(documentsForUpdate: Array<NewDocument>,
                                           update: (document: Document, username: string) => Promise<Document>,
                                           create: (document: Document, username: string) => Promise<Document>,
                                           username: string,
                                           updateMode: boolean): Promise<void> {

        for (let documentForUpdate of documentsForUpdate) {
            updateMode
                ? await update(documentForUpdate as Document, username)
                : await create(documentForUpdate as Document, username); // throws if exists
        }
    }


    async function performRelationsUpdates(targetDocuments: Array<Document>,
                                           update: (document: Document, username: string) => Promise<Document>,
                                           username: string): Promise<void> {

        for (let targetDocument of targetDocuments) await update(targetDocument, username);
    }
}