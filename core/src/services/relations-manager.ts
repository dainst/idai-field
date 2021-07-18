
import {
    append, flow, isArray, isDefined, isNot, isUndefinedOrEmpty, on, sameset, subtract, to, not
} from 'tsfun';
import { Document } from '../model/document';
import {Relation} from '../model/configuration/relation';
import { DatastoreErrors } from '../datastore/datastore-errors'
import { Datastore, FindIdsResult, FindResult } from '../datastore/datastore';
import { ConnectedDocsWriter } from './connected-docs-writer'
import { NewDocument } from '../model/document';
import { ProjectConfiguration } from './project-configuration'
import {  ON_RESOURCE_ID, ResourceId, RESOURCE_DOT_ID } from '../constants';
import { Query } from '../model/query'
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;
import { Resource } from '../model/resource';



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


    /**
     * Gets one or more documents, possibly with documents connected via hierarchical relations.
     * 
     * @throws DatastoreErrors
     */
    public async get(id: ResourceId): Promise<Document>;
    public async get(ids: Array<ResourceId>): Promise<Array<Document>>;
    public async get(id: ResourceId, options: { descendants: true, toplevel?: false }): Promise<Array<Document>>
    public async get(id: ResourceId, options: { antecendants: true }): Promise<Array<Document>>
    public async get(ids: Array<ResourceId>, options: { descendants: true, toplevel?: false }): Promise<Array<Document>>
    public async get(ids_: any, options?: { descendants?: true, toplevel?: false, antecendants?: true }): Promise<any> {

        if (options?.antecendants) {
            // any of these can be removed after implementing corresponding behaviour, if needed
            if (isArray(ids_)) throw 'multiple ids not allowed with antecendants option';
            if (options.descendants) throw 'do not use descendants with antecendants option';
            if (options.toplevel) throw 'do not use toplevel with antecendants option';
        }

        const ids = isArray(ids_) ? ids_ : [ids_];
        const returnSingleItem = 
            !isArray(ids_) 
            && options?.descendants !== true 
            && options?.antecendants !== true;

        try {
            const documents = [];
            for (const id of ids) {
                const document = await this.datastore.get(id);
                documents.push(document);
                if (options?.descendants === true) documents.push(...(await this.getDescendants(document)));
                if (options?.antecendants === true) documents.push(...(await this.getAntecendants(document)));
            }
            if (returnSingleItem) return documents[0];
            if (options?.toplevel !== false) return documents;

            return documents
                .filter(
                    on([Document.RESOURCE, Resource.RELATIONS, Relation.Hierarchy.LIESWITHIN], 
                       not(isUndefinedOrEmpty)));

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

        const findResult = await this.findLiesWithinDocs(document.resource.id, false) as FindResult;
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

        if (this.projectConfiguration.isSubcategory(document.resource.category, 'Place')) {
            return await this.findPlaceDocsIds(document.resource.id, idsToSubtract);
        }
        return this.projectConfiguration.isSubcategory(document.resource.category, 'Operation')
            ? await this.findRecordedInDocsIds(document.resource.id, skipDocuments, idsToSubtract)
            : await this.findLiesWithinDocs(document.resource.id, skipDocuments, idsToSubtract);
    }


    private async findPlaceDocsIds(resourceId: string,
                                   idsToSubtract: string[]) {

        const docs = (await this.findLiesWithinDocs(resourceId, false, idsToSubtract) as FindResult).documents;
        const overviewDocs = [];
        const recordedDocs = [];
        for (const doc of docs) {
            overviewDocs.push(doc);
            if (!this.projectConfiguration.isSubcategory(doc.resource.category, 'Place')) {
                recordedDocs.push(await this.findRecordedInDocsIds(doc.resource.id, false, []));
            }
        }
        const overviewDocAsFindIdResults =
            overviewDocs.map(doc => (
                {
                    totalCount: 1,
                    documents: [doc],
                    ids: [doc.resource.id]
                }
            ));
        const findIdResults = recordedDocs.concat(overviewDocAsFindIdResults);
        return findIdResults.reduce((acc, val) => (
            {
                ids: acc.ids.concat(val.ids),
                totalCount: acc.totalCount + val.totalCount,
                documents: acc.documents.concat(val.documents)
            }
        ));
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


    private async getAntecendants(document: Document): Promise<Array<Document>> {

        const documents: Array<Document> = [];

        let current = document;
        while (Document.hasRelations(current, Relation.Hierarchy.LIESWITHIN)
               || Document.hasRelations(current, Relation.Hierarchy.RECORDEDIN)) {

            const parent = await this.datastore.get(
                Document.hasRelations(current, Relation.Hierarchy.LIESWITHIN)
                    ? current.resource.relations[Relation.Hierarchy.LIESWITHIN][0]
                    : current.resource.relations[Relation.Hierarchy.RECORDEDIN][0]
            );

            documents.push(parent);
            current = parent;
        }

        return documents;
    }
}
