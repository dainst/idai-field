
import {
    append, flow, isArray, isDefined, isNot, isUndefinedOrEmpty, on, sameset, set, subtract, to,
} from 'tsfun';
import { Document } from '../model/document';
import {Relation} from '../model/configuration/relation';
import { Datastore, FindIdsResult, FindResult } from '../datastore/datastore';
import { ConnectedDocsWriter } from './connected-docs-writer'
import { NewDocument } from '../model/document';
import { ProjectConfiguration } from './project-configuration'
import {  ON_RESOURCE_ID, RESOURCE_DOT_ID } from '../constants';
import { Query } from '../model/query'
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;
import { Resource } from '../model/resource';
import { childrenOf } from '../base-config';



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
        private projectConfiguration: ProjectConfiguration
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
                        oldVersion: Document = document as Document, // side effect: modified in place. for reasons of how the document cache behaves
                        revisionsToSquash: Document[] = []): Promise<Document> {

        const persistedDocument = await this.updateWithConnections(
            document as Document, oldVersion, revisionsToSquash);

        await this.fixIsRecordedInInLiesWithinDocs(persistedDocument);
        return persistedDocument;
    }


    // TODO move to Hierarchy
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

        const descendants = await this._getDescendants(document);
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
            updated, [oldVersion].concat(revisionsToSquash));
        return updated as Document;
    }


    private async removeWithConnectedDocuments(document: Document) {

        await this.connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(
            document);
        await this.datastore.remove(document);
    }


    private async fixIsRecordedInInLiesWithinDocs(document: Document) {

        if (isUndefinedOrEmpty(document.resource.relations[RECORDED_IN])) return;

        const findResult = await this.findLiesWithinDocs(document.resource.id);
        const docsToCorrect =
            findResult
                .documents
                .filter(on(['resource', 'relations', RECORDED_IN], isArray))
                .filter(isNot(on(['resource', 'relations', RECORDED_IN], sameset)(document) as any));

        for (let docToCorrect of docsToCorrect) {
            const cloned = Document.clone(docToCorrect);
            cloned.resource.relations[RECORDED_IN] = document.resource.relations[RECORDED_IN];
            await this.datastore.update(cloned, undefined);
        }
    }


    private persistIt(document: Document|NewDocument,
                      squashRevisionIds: string[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document);
    }


    private async findDescendants(document: Document,
                                  skipDocuments = false,
                                  idsToSubtract?: string[]): Promise<FindIdsResult> {

        const query: Query = childrenOf(document.resource.id);
        query.constraints['id:match'] = {
            value: idsToSubtract,
            subtract: true
        };

        return skipDocuments
            ? this.datastore.findIds(query)
            : await this.datastore.find(query);
    }


    private async findLiesWithinDocs(resourceId: string): Promise<FindResult> {

        const query: Query = {
            constraints: {
                'liesWithin:contain': {
                    value: resourceId,
                    searchRecursively: true
                }
            }
        };
        return this.datastore.find(query);
    }


    private async _getDescendants(...documents: Array<Document>): Promise<Array<Document>> {

        const results = [];
        for (const document of documents) {
            results.push(...(await this.findDescendants(document) as FindResult).documents);
        }
        return results;
    }    
}
