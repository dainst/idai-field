import {NewDocument, Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';


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


    export async function go(documents: Array<Document>, targetDocuments: Array<Document>|undefined,
                             datastore: DocumentDatastore, username: string,
                             useUpdateMethod: boolean /* else new doc, then use create */) {

        // TODO Check for conflicts

        await performDocumentsUpdates(documents, datastore, username, useUpdateMethod);
        if (targetDocuments) await performRelationsUpdates(targetDocuments, datastore, username);
    }


    async function performDocumentsUpdates(documents: Array<NewDocument>, datastore: DocumentDatastore,
                                           username: string, updateMode: boolean): Promise<void> {

        if (updateMode) {
            await datastore.bulkUpdate(documents as Array<Document>, username);
        } else {
            await datastore.bulkCreate(documents, username);    // throws exception if an id already exists
        }
    }


    async function performRelationsUpdates(targetDocuments: Array<Document>, datastore: DocumentDatastore,
                                           username: string): Promise<void> {

        if (targetDocuments.length > 0) await datastore.bulkUpdate(targetDocuments, username);
    }
}