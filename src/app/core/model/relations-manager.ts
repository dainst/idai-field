import {Injectable} from '@angular/core';
import {isArray, isDefined, isNot, isUndefinedOrEmpty, on, sameset, to} from 'tsfun';
import {Document, NewDocument} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ConnectedDocsWriter} from './connected-docs-writer';
import {clone} from '../util/object-util';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {HierarchicalRelations} from './relation-constants';
import {SettingsProvider} from '../settings/settings-provider';
import {FindIdsResult, FindResult} from '../datastore/model/read-datastore';
import {Query} from '../datastore/model/query';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {ResourceId} from '../constants';


@Injectable()
/**
 * When persisting or deleting, PersistenceManager maintains a consistent state of relations between the
 * documents by updating related documents relations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RelationsManager {

    private connectedDocsWriter: ConnectedDocsWriter;

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
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
    public async update(document: NewDocument|Document,
                        oldVersion: Document = document as Document,
                        revisionsToSquash: Document[] = []): Promise<Document> {

        const persistedDocument = await this.updateWithConnections(
            document as Document, oldVersion, revisionsToSquash);

        await this.fixIsRecordedInInLiesWithinDocs(persistedDocument, this.settingsProvider.getSettings().username);
        return persistedDocument;
    }


    /**
     * Gets documents including all of their descendants
     * @param ids
     */
    public async get(...ids: Array<ResourceId>): Promise<Array<Document>> {

        try {
            const documents = [];
            for (const id of ids) {
                const document = await this.datastore.get(id);
                documents.push(...([document].concat(await this.getDescendants(document))));
            }
            return documents;
        } catch {
            return [];
        }
    }


    public async getDescendants(...documents: Array<Document>): Promise<Array<Document>> {

        const results = [];
        for (const document of documents) {
            results.push(...(await this.findDescendants(document) as FindResult).documents);
        }
        return results;
    }


    // TODO suggestion: remove; use getDescendants().length instead; or use get().length and subtract number of top level elements; maybe also we want to have the total number of elements (get().length) anyway, not only the number of descendants
    public async getDescendantsCount(document: Document): Promise<number> {

        return !document.resource.id
            ? 0
            : (await this.findDescendants(document, true)).totalCount;
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all descendant documents (documents with an 'isRecordedIn' or 'liesWithin' relation pointing to
     * this document.
     * Deletes all corresponding inverse relations.
     *
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document) {

        const documentsToBeDeleted = (await this.getDescendants(document)).concat([document]);
        for (let document of documentsToBeDeleted) await this.removeWithConnectedDocuments(document);
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


    private async findDescendants(document: Document, skipDocuments = false): Promise<FindIdsResult> {

        return this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
            ? await this.findRecordedInDocs2(document.resource.id, skipDocuments)
            : await this.findLiesWithinDocs(document.resource.id, skipDocuments);
    }


    // TODO review name clash; btw. why is this public?
    public async findRecordedInDocs2(resourceId: string, skipDocuments: boolean): Promise<FindIdsResult> {

        const query: Query = {
            constraints: { 'isRecordedIn:contain': resourceId }
        };

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }


    private async findLiesWithinDocs(resourceId: string, skipDocuments: boolean): Promise<FindIdsResult> {

        const query: Query = {
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    searchRecursively: true
                }
            }
        };

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }
}
