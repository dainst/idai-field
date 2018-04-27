import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, Resource} from 'idai-components-2/core';
import {ConnectedDocsResolution} from './connected-docs-resolution';
import {M} from '../../m';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ObjectUtil} from '../../util/object-util';


@Injectable()
/**
 * With a document to persist, it determines which other documents are 
 * affected by being related to the document in its current or previous state.
 * When persisting, it maintains a consistent state of relations between the objects
 * by also persisting the related documents with updated target relations.
 *
 * Also adds created and modified actions to persisted documents.
 * 
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceManager {

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration
    ) {}


    /**
     * Persists the loaded object and all the objects that are or have been in relation
     * with the object before the method call.
     *
     * If the document is
     *
     *   { resource: { id: 1, relations: { includes: [2] } } },
     *
     * this means that also another document is updated, namely
     *
     *   { resource: { id: 2 } } },
     *
     * which gets updated to
     *
     *   { resource: { id: 2, relations: { belongsTo: [1] } } }.
     *
     * This happens based on a configuration which includes
     *
     *   { name: includes, inverse: belongsTo }.
     *
     * If the configuration looks like this
     *
     *   { name: includes, inverse: NO-INVERSE }
     *
     * the other documents back relation gets not set. If no other relation gets
     * persisted on that document, it does not get updated at all.
     *
     * @returns {Promise<string>} If all objects could get stored,
     *   the promise will resolve to <code>undefined</code>. If one or more
     *   objects could not get stored properly, the promise will get rejected
     *   with msgWithParams.
     */
    public async persist(
        document: NewDocument,
        username: string,
        oldVersion: NewDocument = document,
        revisionsToSquash: Document[] = [],
        ): Promise<any> {

        const oldVersions = [ObjectUtil.cloneObject(oldVersion)].concat(revisionsToSquash);

        // const documentToSave = ObjectUtil.cloneObject(document);
        const documentToSave = document; // TODO clone it instead

        const persistedDocument = await this.persistIt(documentToSave as Document, username, revisionsToSquash);

        let connectedDocs;
        try {
            connectedDocs = await Promise.all(this.getConnectedDocs(documentToSave as Document, oldVersions as Document[]))
        } catch (_) {
            throw [M.PERSISTENCE_ERROR_TARGETNOTFOUND];
        }
        await this.updateDocs(documentToSave as Document, connectedDocs, true, username);

        return persistedDocument;
    }


    private async updateDocs(document: Document, connectedDocs: Array<Document>, setInverseRelations: boolean, user: string) {

        for (let docToUpdate of
            ConnectedDocsResolution.determineDocsToUpdate(
                this.projectConfiguration, document, connectedDocs,
                setInverseRelations)) {

            await this.persistIt(docToUpdate, user);
        }
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all documents with an 'isRecordedIn' relation pointing to this document.
     * Deletes all corresponding inverse relations.
     *
     * @param document
     * @param oldVersions
     * @return {any}
     *   Rejects with
     *     [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *     [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *     [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public remove(document: Document,
                  username: string,
                  oldVersion: Document = document): Promise<any> {

        if (document == undefined) return Promise.resolve();

        return this.getRecordedInDocs(document)
            .then(recordedInDocs => {
                let promise: Promise<any> = Promise.resolve();

                for (let doc of recordedInDocs) {
                    promise = promise.then(() => this.removeDocument(doc, username, []));
                }

                return promise.then(() => this.removeDocument(document, username, [oldVersion]));
            });
    }


    private removeDocument(document: Document, user: string, oldVersions: Array<Document>): Promise<any> {

        return Promise.all(this.getConnectedDocs(document, oldVersions))
            .then(connectedDocs => this.updateDocs(document, connectedDocs, false, user))
            .then(() => this.datastore.remove(document));
    }


    private getConnectedDocs(document: Document, oldVersions: Array<Document>): Array<Promise<Document>> {

        const promisesToGetObjects: Promise<Document>[] = [];
        const ids: string[] = [];

        const documents = [document].concat(oldVersions);

        for (let doc of documents) {
            for (let id of this.extractRelatedObjectIDs(doc.resource)) {
                if (ids.indexOf(id) == -1) {
                    promisesToGetObjects.push(this.datastore.get(id));
                    ids.push(id);
                }
            }
        }

        return promisesToGetObjects;
    }


    private extractRelatedObjectIDs(resource: Resource): Array<string> {

        const relatedObjectIDs = [] as any;

        for (let prop in resource.relations) {
            if (!resource.relations.hasOwnProperty(prop)) continue;
            if (!(this.projectConfiguration as any).isRelationProperty(prop)) continue;

            for (let id of resource.relations[prop]) {
                relatedObjectIDs.push(id as never);
            }
        }

        return relatedObjectIDs;
    }


    private async getRecordedInDocs(document: Document): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': document.resource.id }
        })).documents;
    }


    private persistIt(document: Document|NewDocument, username: string, revisionsToSquash?: Document[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(document as Document, username,
                (revisionsToSquash && revisionsToSquash.length > 0) ? revisionsToSquash : undefined)
            : this.datastore.create(document, username);
    }
}
