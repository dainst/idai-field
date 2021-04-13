import { Document, Datastore, NewDocument } from 'idai-field-core';
import { separate } from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module Updater {

    export async function go(createDocuments: Array<Document>,
                             updateDocuments: Array<Document>|undefined,
                             datastore: Datastore, username: string) {

        const hasConflict = (_: any): boolean => (_['_conflicts']);

        const [createDocumentsWithConflicts, documentsWithoutConflicts] = separate(hasConflict, createDocuments);
        await performBulk(documentsWithoutConflicts, datastore, username, false);
        await performRegular(createDocumentsWithConflicts, datastore, username, false);

        if (updateDocuments) {
            const [updateDocumentsWithConflicts, targetDocumentsWithoutConflicts] = separate(hasConflict, updateDocuments);
            await performBulk(targetDocumentsWithoutConflicts, datastore, username, true);
            await performRegular(updateDocumentsWithConflicts, datastore, username, true);
        }
    }


    async function performRegular(documents: Array<NewDocument>, datastore: Datastore,
                                                           username: string, updateMode: boolean): Promise<void> {

        for (let document of documents) {
            if (updateMode) await datastore.update(document as Document, username);
            else await datastore.create(document, username);    // throws exception if an id already exists
        }
    }


    async function performBulk(documents: Array<NewDocument>,
                               datastore: Datastore,
                               username: string,
                               updateMode: boolean): Promise<void> {

        if (documents.length === 0) return;

        // We chunk to show progress on the console
        const chunkSize = 250;
        const partsInTotal = Math.floor((documents.length-1)/chunkSize) + 1;

        for (let i = 0; (i * chunkSize) < documents.length; i++) {

            const docs = documents.slice(i*chunkSize,i*chunkSize+chunkSize);
            console.debug(`Bulk-importing part ${i+1}/${partsInTotal}`);

            if (updateMode) await datastore.bulkUpdate(docs as Array<Document>, username);
            else await datastore.bulkCreate(docs, username);    // throws exception if an id already exists
        }
    }
}
