import { Injectable } from '@angular/core';
import { DatastoreErrors, Document, Datastore, FindIdsResult, FindResult, Relations, NewDocument, ObjectUtils, ON_RESOURCE_ID, Query, ResourceId, RESOURCE_DOT_ID } from 'idai-field-core';
import {
    append, flow, isArray, isDefined, isNot, isUndefinedOrEmpty, on, sameset, subtract, to,
    undefinedOrEmpty
} from 'tsfun';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { SettingsProvider } from '../settings/settings-provider';
import { ConnectedDocsWriter } from './connected-docs-writer';
import RECORDED_IN = Relations.Hierarchy.RECORDEDIN;


@Injectable()
/**
 * Maintains a consistent state of relations between the
 * documents by updating related documents relations during update or delete operations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class RelationsManager {

    private connectedDocsWriter: ConnectedDocsWriter;

    constructor(
        private datastore: Datastore,
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


    public async get(id: ResourceId): Promise<Document>;
    public async get(ids: Array<ResourceId>): Promise<Array<Document>>;
    public async get(id: ResourceId, options: { descendants: true, toplevel?: false }): Promise<Array<Document>>
    public async get(ids: Array<ResourceId>, options: { descendants: true, toplevel?: false }): Promise<Array<Document>>
    public async get(ids_: any, options?: { descendants: true, toplevel?: false }): Promise<any> {

        const ids = isArray(ids_) ? ids_ : [ids_];
        const returnSingleItem = !isArray(ids_) && options?.descendants !== true;

        try {
            const documents = [];
            for (const id of ids) {
                const document = await this.datastore.get(id);
                documents.push(document);
                if (options?.descendants === true) documents.push(...(await this.getDescendants(document)));
            }
            if (returnSingleItem) return documents [0];
            if (options?.toplevel !== false) return documents;

            return documents.filter(on(['resource', 'relations', Relations.Hierarchy.LIESWITHIN], isNot(undefinedOrEmpty)));

        } catch {
            if (returnSingleItem) throw DatastoreErrors.DOCUMENT_NOT_FOUND;
            return [];
        }
    }


    public async getDescendantsCount(...documents: Array<Document>): Promise<number> {

        const idsToSubtract: string[] = documents.map(to(RESOURCE_DOT_ID));

        let count = 0;
        for (const document of documents) {
            count += !document.resource.id
                ? 0
                : (await this.findDescendants(document, true, idsToSubtract)).totalCount;
        }
        return count;
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
    public async remove(document: Document,
                        options?: { descendants?: true, descendantsToKeep?: Array<Document>}) {

        if (options?.descendants !== true) {
            if (options?.descendantsToKeep !== undefined) throw 'illegal arguments - relationsManager.remove called with descendantsToKeep but descendants option not set';
            await this.removeWithConnectedDocuments(document);
            return;
        }

        const descendants = await this.getDescendants(document);
        const documentsToBeDeleted =
            flow(descendants,
                subtract(ON_RESOURCE_ID, options.descendantsToKeep ?? []),
                append(document));

        for (let document of documentsToBeDeleted) await this.removeWithConnectedDocuments(document);
    }


    private async updateWithConnections(document: Document, oldVersion: Document,
                                        revisionsToSquash: Array<Document>) {

        const revs = revisionsToSquash.map(_ => _._rev).filter(isDefined);
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

        const findResult = await this.findLiesWithinDocs(document.resource.id, false) as FindResult;
        const docsToCorrect =
            findResult
                .documents
                .filter(on(['resource', 'relations', RECORDED_IN], isArray))
                .filter(isNot(on(['resource', 'relations', RECORDED_IN], sameset)(document) as any));

        for (let docToCorrect of docsToCorrect) {
            const cloned = Document.clone(docToCorrect);
            cloned.resource.relations[RECORDED_IN] = document.resource.relations[RECORDED_IN];
            await this.datastore.update(cloned, username, undefined);
        }
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


    private async findDescendants(document: Document, skipDocuments = false,
                                  idsToSubtract?: string[]): Promise<FindIdsResult> {

        return this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
            ? await this.findRecordedInDocsIds(document.resource.id, skipDocuments, idsToSubtract)
            : await this.findLiesWithinDocs(document.resource.id, skipDocuments, idsToSubtract);
    }


    private async findRecordedInDocsIds(resourceId: string,
                                        skipDocuments: boolean,
                                        idsToSubtract?: string[]): Promise<FindIdsResult|FindResult> {

        const query: Query = {
            constraints: { 'isRecordedIn:contain': resourceId }
        };

        if (idsToSubtract) {
            query.constraints['id:match'] = {
                value: idsToSubtract,
                subtract: true
            }
        }

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }


    private async findLiesWithinDocs(resourceId: string, skipDocuments: boolean,
                                     idsToSubtract?: string[]): Promise<FindIdsResult|FindResult> {

        const query: Query = {
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    searchRecursively: true
                }
            }
        };

        if (idsToSubtract) {
            query.constraints['id:match'] = {
                value: idsToSubtract,
                subtract: true
            }
        }

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }


    private async getDescendants(...documents: Array<Document>): Promise<Array<Document>> {

        const results = [];
        for (const document of documents) {
            results.push(...(await this.findDescendants(document) as FindResult).documents);
        }
        return results;
    }
}
