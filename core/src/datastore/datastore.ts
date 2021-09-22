import { IndexFacade } from '../index/index-facade';
import { Document } from '../model/document';
import { NewDocument } from '../model/new-document';
import { Query } from '../model/query';
import { ObjectUtils } from '../tools/object-utils';
import { DatastoreErrors } from './datastore-errors';
import { PouchdbDatastore } from './pouchdb/pouchdb-datastore';
import { Converter } from './converter';
import { DocumentCache } from './document-cache';



export type Find = (query: Query) => Promise<FindResult>;


export interface FindIdsResult {

    ids: string[];
    totalCount: number;
    queryId?: string;
}


export interface FindResult extends FindIdsResult {

    documents: Array<Document>;
}


export module FindResult {

    export const DOCUMENTS = 'documents';
    export const TOTALCOUNT = 'totalCount';
}


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
                private categoryConverter: Converter) {
    }


    public suppressWait = false;


    /**
     * Persists a given document. If document.resource.id is not set,
     * it will be set to a generated value. In case of an error it remains undefined.
     *
     * In case of a successful call, document.modified and document.created get set,
     * otherwise they remain undefined.
     *
     * @param doc
     * @param username
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [DOCUMENT_RESOURCE_ID_EXISTS] - if a document with doc.resource.id already exists
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     * @throws if resource.category is unknown
     */
    public async create(document: NewDocument, username: string): Promise<Document> {

        return this.updateIndex(await this.datastore.create(document, username));
    }


    public async bulkCreate(documents: Array<NewDocument>, username: string): Promise<Array<Document>> {

        return (await this.datastore.bulkCreate(documents, username)).map(document => {
            return this.updateIndex(document);
        });
    }


    /**
     * Updates an existing document
     *
     * @param doc
     * @param username
     * @param squashRevisionsIds
     * @returns {Promise<Document>} a document
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     * @throws [SAVE_CONFLICT] - in case of conflict
     * @throws [DOCUMENT_NO_RESOURCE_ID] - if doc has no resource id
     * @throws [INVALID_DOCUMENT] - in case doc is not valid
     * @throws [DOCUMENT_NOT_FOUND] - if document has a resource id, but does not exist in the db
     */
    public async update(document: Document, username: string, squashRevisionsIds?: string[]): Promise<Document> {

        return this.updateIndex(await this.datastore.update(document, username, squashRevisionsIds));
    }


    public async bulkUpdate(documents: Array<Document>, username: string): Promise<Array<Document>> {

        return (await this.datastore.bulkUpdate(documents, username)).map(document => {
            return this.updateIndex(document);
        });
    }


    private updateIndex(document: Document) {

        const convertedDocument = this.categoryConverter.convert(document);
        this.indexFacade.put(convertedDocument);

        return !this.documentCache.get(document.resource.id as any)
            ? this.documentCache.set(convertedDocument)
            : this.documentCache.reassign(convertedDocument);
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
    }


    /**
     * @param resourceId the desired document's resource id
     * @param options.skipCache: boolean
     * @param options to control implementation specific behaviour
     * @returns {Promise<Document>} a document (rejects with msgWithParams in case of error)
     * @throws [DOCUMENT_NOT_FOUND] - in case document is missing
     * @throws [INVALID_DOCUMENT] - in case document is not valid
     */
    public async get(id: string, options?: { skipCache: boolean }): Promise<Document> {

        const cachedDocument = this.documentCache.get(id);

        if ((!options || !options.skipCache) && cachedDocument) {
            return cachedDocument;
        }

        let document = this.categoryConverter.convert(await this.datastore.fetch(id));

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
     * @param query
     * @param ignoreCategories to make queries faster, the facility to return only the
     *   categories the datastore is supposed to return, can be turned off. This can make sense if
     *   one performs constraint queries, where one knows that all documents returned are of
     *   allowed categories, due to the nature of the relations to which the constraints refer.
     * 
     * @param query the query object
     * @returns {Promise<IdaiFieldFindResult>} result object
     * @throws [GENERIC_ERROR (, cause: any)] - in case of error, optionally including a cause
     */
    public async find(query: Query, ignoreCategories: boolean = false): Promise<FindResult> {

        const { ids } = this.findIds(query, ignoreCategories);
        const { documents, totalCount } = await this.getDocumentsForIds(ids, query.limit, query.offset);

        return {
            documents: documents,
            ids: ids,
            totalCount: totalCount
        }
    }


    public putCache(document: Document) {

        this.documentCache.reassign(this.categoryConverter.convert(document));
    }    


    public findIds(query: Query, ignoreCategories: boolean = false /* TODO review */): FindIdsResult {

        if (!query.categories && !ignoreCategories) {
            query = ObjectUtils.jsonClone(query);
            query.categories = undefined;
        }

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

        return this.categoryConverter.convert(
            await this.datastore.fetchRevision(docId, revisionId));
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


    private async getDocumentsForIds(ids: string[], limit?: number,
                                     offset?: number): Promise<{documents: Array<Document>, totalCount: number}> {

        let totalCount: number = ids.length;
        let idsToFetch: string[] = ids;

        if (offset) idsToFetch.splice(0, offset);

        if (limit !== undefined) {
            if (limit === 0) return { documents: [], totalCount: totalCount };
            if (limit < idsToFetch.length) idsToFetch = idsToFetch.slice(0, limit);
        }

        const {documentsFromCache, notCachedIds} = await this.getDocumentsFromCache(idsToFetch);
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

        const documents: Array<Document> = [];

        (await this.datastore.bulkFetch(ids)).forEach(document => {
            const convertedDocument = this.categoryConverter.convert(document);

            try {
                documents.push(this.documentCache.set(convertedDocument));
            } catch (errWithParams) {
                if (errWithParams[0] !== DatastoreErrors.UNKNOWN_CATEGORY /* TODO review where this has impact*/) throw errWithParams;
            }
        });

        return documents;
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
}
