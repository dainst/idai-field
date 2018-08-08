import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, toResourceId} from 'idai-components-2/core';
import {DocumentDatastore} from '../datastore/document-datastore';
import {filter, flatMap, flow, includedIn, isNot, mapTo, on, subtract, to} from 'tsfun';
import {TypeUtility} from '../model/type-utility';
import {PersistenceWriter} from './persistence-writer';


// TODO make sure that when a resource is deleted which contains
// children (via liesWithin, that either they also get deleted (like for operation type documents)
// or they get moved to a higher level

// Or solve both problems (that mentioned plus when resources are moved to different operations)
// in view facade so that missing parents are ignored and items get displayed on the top level

@Injectable()
/**
 * When persisting or deleting, PersistenceManager maintains a consistent state of relations between the
 * documents by updating related documents relations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceManager {

    private persistenceWriter: PersistenceWriter;

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private typeUtility: TypeUtility
    ) {
        this.persistenceWriter = new PersistenceWriter(datastore, projectConfiguration);
    }


    /**
     * Persists document and all the objects that are or have been in relation
     * with the object before the method call.
     *
     * If the document is { resource: { id: 1, relations: { includes: [2] } } },
     * this means that also another document is updated, namely { resource: { id: 2 } } }.
     * which gets updated to { resource: { id: 2, relations: { belongsTo: [1] } } }.
     *
     * On top of that, one oldVersion and some revisionsToSquash can be specified.
     * These are compared with document to determine which relations have been removed.
     *
     * @param document an existing or a new document
     * @param username
     * @param oldVersion to be used only if document is an existing document.
     * @param revisionsToSquash these revisions get deleted while updating document
     * @returns a copy of the updated document
     * @throws msgWithParams
     */
    public async persist(
        document: NewDocument|Document,
        username: string,
        oldVersion: Document = document as Document,
        revisionsToSquash: Document[] = [],
        ): Promise<Document> {

        const persistedDocument = await this.persistenceWriter.update(
            document as Document, oldVersion, revisionsToSquash, username);

        // TODO make separate 2nd pass in which all child documents (by liesWithin) get checked
        // if they have the same isRecordedIn as the document and correct them if not

        return persistedDocument;
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all documents with an 'isRecordedIn' relation pointing to this document.
     * Deletes all corresponding inverse relations.
     *
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document,
                  username: string,
                  oldVersion: Document = document) {

        // don't rely on isRecordedIn alone. Make sure it is really an operation subtype
        if (this.typeUtility.isSubtype(document.resource.type, "Operation")) {
            for (let recordedInDoc of (await this.getDocsRecordedIn(document.resource.id))) {
                await this.removeDocument(recordedInDoc, username);
            }
        }
        await this.removeDocument(document, username, oldVersion);
    }


    private async removeDocument(
        document: Document,
        user: string, oldVersion: Document = document) {

        await this.persistenceWriter.remove(document, oldVersion, user);
    }


    private async getDocsRecordedIn(resourceId: string): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId }
        })).documents;
    }
}
