import {NewDocument} from 'idai-components-2/src/model/core/new-document';
import {Document} from 'idai-components-2/src/model/core/document';


/**
 * TODO change to batch updates and rename to BatchUpdater
 * for a first version implement it like this:
 *   check if the project contains conflicts. if yes. display a msg to the user, that import will run slow if conflicts not solved first.
 *   then:
 *     if contains conflicts: update or create everything like before. iterate over all docs separately
 *     if not contains conflicts: do batch create or update for documents, batch update for relation documents.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportUpdater {


    export async function go(documents: Array<Document>,
                             targetDocuments: Array<Document>|undefined,
                             update: (document: Document, username: string) => Promise<Document>,
                             create: (document: Document, username: string) => Promise<Document>,
                             /* bulkUpdate: (documents: Array<Document>, username: string) =>  */
                             /* bulkCreate: (documents: Array<Document>, username: string) =>  */
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