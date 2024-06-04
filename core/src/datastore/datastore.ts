import { clone, Map } from 'tsfun';
import { IndexFacade } from '../index/index-facade';
import { Document } from '../model/document';
import { NewDocument } from '../model/document';
import { Query } from '../model/query';
import { Name } from '../tools/named';
import { DocumentConverter } from './document-converter';
import { DatastoreErrors } from './datastore-errors';
import { DocumentCache } from './document-cache';
import { PouchdbDatastore } from './pouchdb/pouchdb-datastore';
import { WarningsUpdater } from './warnings-updater';
import { ProjectConfiguration } from '../services/project-configuration';
import { Indexer } from '../index';
import { Warnings } from '../model';


export type FindOptions = {
    includeResourcesWithoutValidParent?: boolean;
};


/**
 * This datastore provides everything necessary
 * to power a idai-field application:
 *
 * 1) A PouchDB based datastore layer, with gives us synchronization.
 *
 * 1) A document cache for faster access and also to allow
 *    for clients to work with references to documents.
 *
 * 2) Returns fully checked instances of
 *    Document,
 *    so that the rest of the app can rely that the declared
 *    fields are present.
 *
 * The errors with which the methods reject, like GENERIC_SAVE_ERROR,
 * are constants of {@link DatastoreErrors}, so GENERIC_SAVE_ERROR really
 * is DatastoreErrors.GENERIC_SAVE_ERROR. The brackets [] are array indicators,
 * so [GENERIC_SAVE_ERROR] is an array containing one element, which is the string
 * corresponding to GENERIC_SAVE_ERROR.
 * 
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class Datastore {

    constructor(private datastore: PouchdbDatastore,
                private indexFacade: IndexFacade,
                private documentCache: DocumentCache,
                private documentConverter: DocumentConverter,
                private projectConfiguration: ProjectConfiguration,
                private getUser: () => Name) {
    }
    

    /**
     * Persists a given document. If document.resource.id is not set,
     * it will be set to a generated value. In case of an error it remains undefined.
     *
     * In case of a successful call, document.modified and document.created get set,
     * otherwise they remain undefined.
     *
     * @param doc
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [DOCUMENT_RESOURCE_ID_EXISTS] - if a document with doc.resource.id already exists
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     * @throws if resource.category is unknown
     */
    public async create(document: NewDocument): Promise<Document> {

        return this.updateIndex(await this.datastore.create(document, this.getUser()));
    }


    public async bulkCreate(documents: Array<NewDocument>): Promise<Array<Document>> {

        const resultDocuments: Array<Document> = [];
        for (let document of await this.datastore.bulkCreate(documents, this.getUser())) {
            resultDocuments.push(await this.updateIndex(document, false));
        }

        this.indexFacade.notifyObservers();

        return resultDocuments;
    }


    /**
     * Updates an existing document
     *
     * As lambda, to allow passing as Get (see companion namespace below).
     * 
     * @param doc
     * @param squashRevisionsIds
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [SAVE_CONFLICT] - in case of conflict
     * @throws [DOCUMENT_NO_RESOURCE_ID] - if doc has no resource id
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     * @throws [DOCUMENT_NOT_FOUND] - if document has a resource id, but does not exist in the db
     */
    public update: Datastore.Update = async (document: Document, squashRevisionsIds?: string[]): Promise<Document> => {

        const previousWarnings: Warnings = document.warnings;
        delete document.warnings;

        return this.updateIndex(
            await this.datastore.update(document, this.getUser(), squashRevisionsIds),
            true,
            previousWarnings
        );
    }


    public async bulkUpdate(documents: Array<Document>): Promise<Array<Document>> {

        const previousWarnings: Map<Warnings> = {};

        documents.forEach(document => {
            previousWarnings[document.resource.id] = document.warnings;
            delete document.warnings;
        });

        let resultDocuments: Array<Document> = [];
        const updatedDocuments: Array<Document> = await this.datastore.bulkUpdate(documents, this.getUser());
        if (updatedDocuments.length < 100) {
            for (let document of updatedDocuments) {
                resultDocuments.push(await this.updateIndex(document, false, previousWarnings[document.resource.id]));
            }
            this.indexFacade.notifyObservers();
        } else {
            resultDocuments = await this.updateIndexWithFullReindexing(updatedDocuments);
        }

        return resultDocuments;
    }


    private async updateIndex(document: Document, notifyObservers: boolean = true,
                              previousWarnings?: Warnings): Promise<Document> {

        const previousVersion: Document = this.documentCache.get(document.resource.id);

        await this.convert(document, notifyObservers, previousWarnings);

        return !previousVersion
            ? this.documentCache.set(document)
            : this.documentCache.reassign(document);
    }


    private async updateIndexWithFullReindexing(documents: Array<Document>): Promise<Array<Document>> {

        const resultDocuments: Array<Document> = [];

        for (let document of documents) {
            const previousVersion: Document = this.documentCache.get(document.resource.id);
            this.documentConverter.convert(document);
            const updatedDocument: Document = !previousVersion
                ? this.documentCache.set(document)
                : this.documentCache.reassign(document);
            resultDocuments.push(updatedDocument);
        }

        await Indexer.reindex(
            this.indexFacade,
            this.datastore.getDb(),
            this.documentCache,
            this.documentConverter,
            this.projectConfiguration,
            true
        );

        return resultDocuments;
    }


     /**
     * Removes an existing document
     *
     * @param doc
     * @returns {Promise<undefined>} undefined
     * @throws [DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     * @throws [DOCUMENT_NOT_FOUND] - if document has a resource id, but does not exist in the db
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     */
    public async remove(document: Document): Promise<void> {

        // we want the doc removed from the indices asap,
        // in order to not risk someone finding it still with findIds due to
        // issues that are theoretically possible because we cannot know
        // when .on('change' (pouchdbdatastore) fires. so we do remove it here,
        // although we know it will be done again for the same doc
        // in .on('change'
        this.indexFacade.remove(document);

        await this.datastore.remove(document);
        this.documentCache.remove(document.resource.id);

        await WarningsUpdater.updateResourceLimitWarnings(
            this,
            this.indexFacade,
            this.projectConfiguration,
            this.projectConfiguration.getCategory(document.resource.category)
        );
        this.indexFacade.notifyObservers();
    }


    /**
     * As lambda, to allow passing as Get (see companion namespace below).
     * 
     * @param resourceId the desired document's resource id
     * @param options.skipCache: boolean
     * @param options to control implementation specific behaviour
     * @returns {Promise<Document>} a document (rejects with msgWithParams in case of error)
     * @throws [DOCUMENT_NOT_FOUND] - in case document is missing
     * @throws [INVALID_DOCUMENT] - in case document is not valid
     */
    public get: Datastore.Get = async (id: string, options?: { skipCache?: boolean })
            : Promise<Document> => {

        const cachedDocument = this.documentCache.get(id);

        if ((!options || !options.skipCache) && cachedDocument) {
            return cachedDocument;
        }

        const document = await this.datastore.fetch(id, options);
        await this.convert(document);

        return cachedDocument
            ? this.documentCache.reassign(document)
            : this.documentCache.set(document);
    }


    /**
      * @param resourceIds the resource ids of the documents to find
      * @returns {Promise<Array<Document>>} list of found documents
      */
    public async getMultiple(ids: string[]): Promise<Array<Document>> {

        return (await this.getDocumentsForIds(ids)).documents;
    }


    /**
     * Perform a fulltext query
     * Find sorts the documents by identifier ascending
     * 
     * As lambda, to allow passing as Find (see companion namespace below).
     * 
     * @param query the query object
     * @returns {Promise<IdaiFieldFindResult>} result object
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     */
    public find: Datastore.Find = async (query: Query, options: FindOptions = {}): Promise<Datastore.FindResult> => {

        const clonedQuery: Query = clone(query);
        if (!options.includeResourcesWithoutValidParent) {
            if (!clonedQuery.constraints) clonedQuery.constraints = {};
            clonedQuery.constraints['missingOrInvalidParent:exist'] = 'UNKNOWN';
        }

        const { ids } = this.findIds(clonedQuery);
        const { documents, totalCount } = await this.getDocumentsForIds(ids, clonedQuery.limit, clonedQuery.offset);

        return {
            documents: documents,
            ids: ids,
            totalCount: totalCount
        }
    }


    public convert: Datastore.Convert = async (document: Document, notifyObservers: boolean = true,
                                               previousWarnings?: Warnings) => {
        
        this.documentConverter.convert(document);
        await this.updateWarnings(document, notifyObservers, previousWarnings);
    }  


    /**
     * As lambda, to allow passing as FindIds (see companion namespace below).
     * 
     * @param query 
     * @returns 
     */
    public findIds: Datastore.FindIds = (query: Query): Datastore.FindIdsResult => {

        const orderedResults: string[] = this.getIds(query);

        return {
            ids: orderedResults,
            totalCount: orderedResults.length
        };
    }


    /**
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @throws [DOCUMENT_NOT_FOUND] - in case of error
     */
    public async getRevision(docId: string, revisionId: string): Promise<Document> {

        const revision: Document = await this.datastore.fetchRevision(docId, revisionId);
        await this.convert(revision);
        return revision;
    }


    /**
     * @param query
     * @return an array of the resource ids of the documents the query matches.
     *   The sort order of the ids is determined in that way that ids of documents with newer modified
     *   dates come first. They are sorted by last modified descending, so to speak.
     *   If two or more documents have the same last modified date, their sort order is unspecified.
     *   The modified date is taken from document.modified[document.modified.length-1].date
     */
    private getIds(query: Query): string[] {

        try {
            return this.indexFacade.find(query);
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    private async getDocumentsForIds(ids: string[], 
                                     limit?: number,
                                     offset?: number): Promise<{documents: Array<Document>, totalCount: number}> {

        let totalCount: number = ids.length;
        let idsToFetch: string[] = ids;

        if (offset) idsToFetch.splice(0, offset);

        if (limit !== undefined) {
            if (limit === 0) return { documents: [], totalCount: totalCount };
            if (limit < idsToFetch.length) idsToFetch = idsToFetch.slice(0, limit);
        }

        const { documentsFromCache, notCachedIds } = await this.getDocumentsFromCache(idsToFetch);
        let documents = documentsFromCache;

        if (notCachedIds.length > 0) {
            try {
                const documentsFromDatastore = await this.getDocumentsFromDatastore(notCachedIds);
                documents = this.mergeDocuments(documentsFromCache, documentsFromDatastore, idsToFetch);
                totalCount -= (idsToFetch.length - documents.length);
            } catch (e) {
                console.error('Error while fetching documents from datastore', e);
                return { documents: [], totalCount: 0 };
            }
        }

        return {
            documents: documents,
            totalCount: totalCount
        };
    }


    private async getDocumentsFromCache(ids: string[])
            : Promise<{ documentsFromCache: Array<Document>, notCachedIds: string[] }> {

        const documents: Array<Document> = [];
        const notCachedIds: string[] = [];

        for (let id of ids) {
            const document = this.documentCache.get(id);
            if (document) {
                documents.push(document);
            } else {
                notCachedIds.push(id);
            }
        }

        return {
            documentsFromCache: documents,
            notCachedIds: notCachedIds
        };
    }


    private async getDocumentsFromDatastore(ids: string[]): Promise<Array<Document>> {

        const result: Array<Document> = [];

        const documents: Array<Document> = await this.datastore.bulkFetch(ids);
        for (let document of documents) {
            document = this.documentCache.set(document);
            await this.convert(document);
            result.push(document);
        }

        return result;
    }


    private mergeDocuments(documentsFromCache: Array<Document>, 
                           documentsFromDatastore: Array<Document>,
                           idsInOrder: string[]): Array<Document> {

        const documents = documentsFromCache.concat(documentsFromDatastore);

        documents.sort((a: Document, b: Document) => {
            return idsInOrder.indexOf(a.resource.id) < idsInOrder.indexOf(b.resource.id)
                ? -1
                : 1;
        });

        return documents;
    }


    private async updateWarnings(document: Document, notifyObservers: boolean, previousWarnings?: Warnings) {

        if (!previousWarnings) previousWarnings = document.warnings;
        WarningsUpdater.updateIndexIndependentWarnings(document, this.projectConfiguration);

        this.indexFacade.put(document);
        
        const previousVersion: Document|undefined = this.documentCache.get(document.resource.id);
        const previousIdentifier: string|undefined = previousVersion?.resource.identifier;

        await WarningsUpdater.updateIndexDependentWarnings(
            document, this.indexFacade, this.documentCache, this.projectConfiguration, this,
            previousIdentifier, previousWarnings, true
        );
        if (notifyObservers) this.indexFacade.notifyObservers();
    }
}


export namespace Datastore {

    export type Get = (id: string, options?: { skipCache?: boolean, conflicts?: boolean }) => Promise<Document>;

    export type Find = (query: Query, options?: FindOptions) => Promise<FindResult>;

    export type FindIds = (query: Query) => FindIdsResult;

    export type Update = (document: Document, squashRevisionsIds?: string[]) => Promise<Document>;

    export type Convert = (document: Document, notifyObservers?: boolean, previousWarnings?: Warnings) => void;


    export interface FindIdsResult {

        ids: string[];
        totalCount: number;
        queryId?: string;
    }


    export interface FindResult extends FindIdsResult {

        documents: Array<Document>;
    }


    export namespace FindResult {

        export const DOCUMENTS = 'documents';
        export const TOTALCOUNT = 'totalCount';
    }
}
