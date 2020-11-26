import {Injectable} from '@angular/core';
import {sameset, isArray, isNot, isUndefinedOrEmpty, on, isDefined, to, flatten, identity, includedIn} from 'tsfun';
import {Document, NewDocument, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ConnectedDocsWriter} from './connected-docs-writer';
import {clone} from '../util/object-util';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {HierarchicalRelations, ImageRelations} from './relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {DescendantsUtility} from './descendants-utility';
import {SettingsProvider} from '../settings/settings-provider';
import {map as asyncMap} from 'tsfun/async';
import {map, reduce} from 'tsfun/associative';


@Injectable()
/**
 * When persisting or deleting, PersistenceManager maintains a consistent state of relations between the
 * documents by updating related documents relations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceManager {

    private connectedDocsWriter: ConnectedDocsWriter;

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private descendantsUtility: DescendantsUtility,
        private settingsProvider: SettingsProvider
    ) {
        this.connectedDocsWriter = new ConnectedDocsWriter(this.datastore, this.projectConfiguration);
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
     * @param oldVersion to be used only if document is an existing document.
     * @param revisionsToSquash these revisions get deleted while updating document
     * @returns a copy of the updated document
     * @throws msgWithParams
     */
    public async persist(document: NewDocument|Document,
                         oldVersion: Document = document as Document,
                         revisionsToSquash: Document[] = []): Promise<Document> {

        const persistedDocument = await this.updateWithConnections(
            document as Document, oldVersion, revisionsToSquash);

        await this.fixIsRecordedInInLiesWithinDocs(persistedDocument, this.settingsProvider.getSettings().username);
        return persistedDocument;
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all child documents (documents with an 'isRecordedIn' or 'liesWithin' relation pointing to
     * this document.
     * Deletes all corresponding inverse relations.
     *
     * @returns leftovers. Leftovers are documents which are connected to one of the documents of the hierarchy of
     *   the deleted documents, which are not connected to any other documents except those to be deleted.
     *
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document) {

        const documentsToBeDeleted = (await this.descendantsUtility.fetchChildren(document)).concat([document]);
        const idsOfDocumentsToBeDeleted = documentsToBeDeleted.map(toResourceId);

        const documentsConnectedExclusivelyToThoseToBeDeleted = [];
        for (let targetDocument of (await this.getRelatedDocuments(documentsToBeDeleted))) {

            // TODO handle isRecordedIn ?

            let exclusivelyConnectedToDocumentsToBeDeleted = true;
            const allTargetIds = flatten(map(targetDocument.resource.relations, identity) as any) as any; // TODO extract function
            for (let targetId of allTargetIds) {
                if (!idsOfDocumentsToBeDeleted.includes(targetId)) exclusivelyConnectedToDocumentsToBeDeleted = false;
            }
            if (exclusivelyConnectedToDocumentsToBeDeleted) documentsConnectedExclusivelyToThoseToBeDeleted.push(targetDocument);
        }

        for (let document of documentsToBeDeleted) await this.removeWithConnectedDocuments(document);

        return documentsConnectedExclusivelyToThoseToBeDeleted;
    }


    // TODO remove duplication with catalog util get related images
    private async getRelatedDocuments(documents: Array<Document>): Promise<Array<Document>> {

        const documentsIds = documents.map(toResourceId);
        const idsOfRelatedDocuments = flatten(
            documents
                .map(document => {
                    return flatten(map(document.resource.relations, identity) as any) as any;
                })
                .filter(isDefined)) // TODO review
            .filter(isNot(includedIn(documentsIds)));

        return await asyncMap(idsOfRelatedDocuments, async id => {
            return await this.datastore.get(id as any);
        });
    }


    private async updateWithConnections(document: Document, oldVersion: Document,
                                        revisionsToSquash: Array<Document>) {

        const revs = revisionsToSquash.map(to(Document._REV)).filter(isDefined);
        const updated = await this.persistIt(document, revs);

        await this.connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(
            updated, [oldVersion].concat(revisionsToSquash), this.settingsProvider.getSettings().username);
        return updated as Document;
    }


    private async removeWithConnectedDocuments(document: Document) {

        await this.connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(
            document, this.settingsProvider.getSettings().username);
        await this.datastore.remove(document);
    }


    private async fixIsRecordedInInLiesWithinDocs(document: Document, username: string) {

        if (isUndefinedOrEmpty(document.resource.relations[RECORDED_IN])) return;

        const docsToCorrect = (await this.findRecordedInDocs(document.resource.id))
            .filter(on('resource.relations.' + RECORDED_IN, isArray))
            .filter(isNot(on('resource.relations.' + RECORDED_IN, sameset)(document)));

        for (let docToCorrect of docsToCorrect) {
            const cloned = clone(docToCorrect);
            cloned.resource.relations[RECORDED_IN] = document.resource.relations[RECORDED_IN];
            await this.datastore.update(cloned, username, undefined);
        }
    }


    private async findRecordedInDocs(resourceId: string): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId },
        })).documents;
    }


    private persistIt(document: Document|NewDocument,
                      squashRevisionIds: string[]): Promise<Document> {

        const username = this.settingsProvider.getSettings().username;

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document, username);
    }
}
