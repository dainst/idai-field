import {NewDocument, Document} from 'idai-components-2';
import {DocumentDatastore} from '../../datastore/document-datastore';
import {not} from 'tsfun';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ImportUpdater {


    export async function go(documents: Array<Document>, targetDocuments: Array<Document>|undefined,
                             datastore: DocumentDatastore, username: string,
                             useUpdateMethod: boolean /* else new docs, then use create */) {

        const hasConflict = (_: any): boolean => (_['_conflicts']);

        const documentsWithoutConflicts = documents.filter(not(hasConflict)); // TODO write unzip for tsfun
        const documentsWithConflicts = documents.filter(hasConflict);

        await performBulkUpdatesOrCreates(documentsWithoutConflicts, datastore, username, useUpdateMethod);
        await performRegularUpdatesOrCreates(documentsWithConflicts, datastore, username, useUpdateMethod);


        if (targetDocuments) {

            const targetDocumentsWithoutConflicts = targetDocuments.filter(not(hasConflict));
            const targetDocumentsWithConflicts = targetDocuments.filter(hasConflict);

            await performBulkUpdatesOrCreates(targetDocumentsWithoutConflicts, datastore, username, true);
            await performRegularUpdatesOrCreates(targetDocumentsWithConflicts, datastore, username, true);
        }
    }


    async function performRegularUpdatesOrCreates(documents: Array<NewDocument>, datastore: DocumentDatastore,
                                                           username: string, updateMode: boolean): Promise<void> {

        for (let document of documents) {
            if (updateMode) await datastore.update(document as Document, username);
            else await datastore.create(document, username);    // throws exception if an id already exists
        }
    }


    async function performBulkUpdatesOrCreates(documents: Array<NewDocument>, datastore: DocumentDatastore,
                                           username: string, updateMode: boolean): Promise<void> {

        if (documents.length === 0) return;
        if (updateMode) await datastore.bulkUpdate(documents as Array<Document>, username);
        else await datastore.bulkCreate(documents, username);    // throws exception if an id already exists
    }
}