import {Injectable} from '@angular/core';
import {Document, toResourceId, Relations,
    NewDocument, ProjectConfiguration} from 'idai-components-2/core';
import {ConnectedDocsResolution} from './connected-docs-resolution';
import {DocumentDatastore} from '../datastore/document-datastore';
import {subtract, flatMap, flow, filter, to, on, isNot, mapTo, includedIn} from 'tsfun';
import {TypeUtility} from '../model/type-utility';


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

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private typeUtility: TypeUtility
    ) {}


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

        const persistedDocument = await this.persistIt(document, username, mapTo('_rev', revisionsToSquash) /* TODO let caller do the mapTo */);

        const connectedDocs = await this.getExistingConnectedDocs(
            [persistedDocument].concat(oldVersion).concat(revisionsToSquash));

        await this.updateConnectedDocs(persistedDocument, connectedDocs, true, username);

        // TODO make separate 2nd pass in which all child documents (by liesWithin) get checked
        // if they have the same isRecordedIn as the document and correct them if not

        return persistedDocument;
    }


    private async updateConnectedDocs(document: Document, connectedDocs: Array<Document>, setInverseRelations: boolean, user: string) {

        for (let docToUpdate of

            // Note that this does not update a document for beeing target of isRecordedIn
            ConnectedDocsResolution.determineDocsToUpdate(
                this.projectConfiguration, document, connectedDocs,
                setInverseRelations)) {

            await this.persistIt(docToUpdate, user, []);
        }
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

        const connectedDocs = await this.getExistingConnectedDocs([document].concat([oldVersion]));
        await this.updateConnectedDocs(document, connectedDocs, false, user);
        await this.datastore.remove(document);
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const connectedDocuments: Array<Document> = [];
        for (let id of this.getUniqueConnectedDocumentsIds(documents,
                this.projectConfiguration.getAllRelationDefinitions().map(to('name')))) {

            try {
                connectedDocuments.push(await this.datastore.get(id));
            } catch (_) {
                // this can be either due to deletion order, for example when
                // deleting multiple docs recordedIn some other, but related to one another
                // or it can be due to 'really' missing documents. missing documents mean
                // an inconsistent database state, which can for example result
                // of docs not yet replicated
                console.warn('connected document not found', id);
            }
        }
        return connectedDocuments;
    }


    private getUniqueConnectedDocumentsIds(documents: Array<Document>, allowedRelations: string[]) {

        return subtract
            (documents.map(toResourceId)) // TODO get these directly as params
            (flatMap<any>(doc =>
                    Relations.getAllTargets(doc.resource.relations, allowedRelations))(documents));
    }


    private async getDocsRecordedIn(resourceId: string): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId }
        })).documents;
    }


    private persistIt(document: Document|NewDocument, username: string, squashRevisionIds: string[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document, username);
    }
}
