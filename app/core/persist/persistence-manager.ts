import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, Resource} from 'idai-components-2/core';
import {ConnectedDocsResolution} from './connected-docs-resolution';
import {M} from '../../m';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ObjectUtil} from '../../util/object-util';
import {subtract} from 'tsfun';
import {TypeUtility} from '../model/type-utility';


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
        private projectConfiguration: ProjectConfiguration,
        private typeUtility: TypeUtility
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
        ): Promise<Document> {

        const oldVersions = [ObjectUtil.cloneObject(oldVersion)].concat(revisionsToSquash);

        const persistedDocument = await this.persistIt(document as Document, username, revisionsToSquash);

        let connectedDocs;
        try {
            connectedDocs = await this.getExistingConnectedDocs([document as Document].concat(oldVersions as Document[]))
        } catch (_) {
            throw [M.PERSISTENCE_ERROR_TARGETNOTFOUND];
        }
        await this.updateConnectedDocs(document as Document, connectedDocs, true, username);

        return persistedDocument;
    }


    private async updateConnectedDocs(document: Document, connectedDocs: Array<Document>, setInverseRelations: boolean, user: string) {

        for (let docToUpdate of

            // Note that this does not update a document for beeing target of isRecordedIn
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
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document,
                  username: string,
                  oldVersion: Document = document) {

        // dont rely on isRecordedIn alone. Make sure it is really an operation subtype
        if (this.typeUtility.isSubtype(document.resource.type, "Operation")) {
            for (let recordedInDoc of (await this.getDocsRecordedIn(document))) {
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
        for (let id of this.getUniqueConnectedDocumentsIds(documents)) {

            try {
                connectedDocuments.push(await this.datastore.get(id));
            } catch (notexistent) {} // ignore
        }
        return connectedDocuments;
    }


    private getUniqueConnectedDocumentsIds(documents: Array<Document>) {

        return subtract
            (documents.map(_ => _.resource.id))
            (
                documents.reduce((acc: Array<string>, doc) =>
                    acc.concat(this.extractRelatedObjectIDs(doc.resource))
                , [])
            );
    }


    private extractRelatedObjectIDs(resource: Resource): Array<string> {

        const relatedObjectIDs = [] as any;

        for (let prop in resource.relations) {
            if (!resource.relations.hasOwnProperty(prop)) continue;
            if (!this.projectConfiguration.isRelationProperty(prop)) continue;

            for (let id of resource.relations[prop]) {
                relatedObjectIDs.push(id as never);
            }
        }

        return relatedObjectIDs;
    }


    private async getDocsRecordedIn(document: Document): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': document.resource.id }
        })).documents;
    }


    private persistIt(document: Document|NewDocument, username: string, revisionsToSquash?: Document[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                revisionsToSquash && revisionsToSquash.length > 0
                    ? revisionsToSquash.map(_ => (_ as any)['_rev'])
                    : undefined)
            : this.datastore.create(document, username);
    }
}
