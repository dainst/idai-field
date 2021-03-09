import {NewDocument, Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {separate} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module Updater {

    export async function go(documents: Array<Document>, targetDocuments: Array<Document>|undefined,
                             datastore: DocumentDatastore, username: string,
                             useUpdateMethod: boolean /* else new docs, then use create */) {

        const hasConflict = (_: any): boolean => (_['_conflicts']);

        const [documentsWithConflicts, documentsWithoutConflicts] = separate(hasConflict, documents);
        await performBulk(documentsWithoutConflicts, datastore, username, useUpdateMethod);
        await performRegular(documentsWithConflicts, datastore, username, useUpdateMethod);


        if (targetDocuments) {

            const [targetDocumentsWithConflicts, targetDocumentsWithoutConflicts] = separate(hasConflict, targetDocuments);
            await performBulk(targetDocumentsWithoutConflicts, datastore, username, true);
            await performRegular(targetDocumentsWithConflicts, datastore, username, true);
        }
    }


    async function performRegular(documents: Array<NewDocument>, datastore: DocumentDatastore,
                                                           username: string, updateMode: boolean): Promise<void> {

        for (let document of documents) {
            if (updateMode) await datastore.update(document as Document, username);
            else await datastore.create(document, username);    // throws exception if an id already exists
        }
    }


    async function performBulk(documents: Array<NewDocument>, datastore: DocumentDatastore,
                                           username: string, updateMode: boolean): Promise<void> {

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
