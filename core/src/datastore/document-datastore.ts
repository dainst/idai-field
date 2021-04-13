import { IndexFacade } from '../index/index-facade';
import { Document } from '../model/document';
import { NewDocument } from '../model/new-document';
import { Query } from '../model/query';
import { ObjectUtils } from '../tools/object-utils';
import { FindIdsResult, FindResult } from './datastore';
import { DatastoreErrors } from './datastore-errors';
import { PouchdbDatastore } from './pouchdb/pouchdb-datastore';
import { CategoryConverter } from './category-converter';
import { DocumentCache } from './document-cache';


export interface IdaiFieldFindResult<T extends Document> extends FindResult {

    documents: Array<T>
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
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class DocumentDatastore<T extends Document = Document> {

    constructor(private datastore: PouchdbDatastore,
                private indexFacade: IndexFacade,
                private documentCache: DocumentCache<T>,
                private categoryConverter: CategoryConverter<T>) {
    }


    public suppressWait = false;


    /**
     * Implements {@link Datastore#create}
     *
     * @throws if document is not of category T, determined by resource.category
     * @throws if resource.category is unknown
     */
    public async create(document: NewDocument, username: string): Promise<T> {

        return this.updateIndex(await this.datastore.create(document, username));
    }


    public async bulkCreate(documents: Array<NewDocument>, username: string): Promise<Array<T>> {

        return (await this.datastore.bulkCreate(documents, username)).map(document => {
            return this.updateIndex(document);
        });
    }


    /**
     * Implements {@link Datastore#update}
     * @throws if document is not of category T, determined by resource.category
     */
    public async update(document: Document, username: string, squashRevisionsIds?: string[]): Promise<T> {

        return this.updateIndex(await this.datastore.update(document, username, squashRevisionsIds));
    }


    public async bulkUpdate(documents: Array<Document>, username: string): Promise<Array<T>> {

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
     * @throws if document is not of category T, determined by resource.category
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
     * Implements {@link ReadDatastore#get}
     *
     * Additional specs:
     *
     * @param options.skipCache: boolean
     * @throws if fetched doc is not of category T, determined by resource.category
     */
    public async get(id: string, options?: { skipCache: boolean }): Promise<T> {

        const cachedDocument: T = this.documentCache.get(id);

        if ((!options || !options.skipCache) && cachedDocument) {
            return cachedDocument;
        }

        let document: T = this.categoryConverter.convert(await this.datastore.fetch(id));

        return cachedDocument
            ? this.documentCache.reassign(document)
            : this.documentCache.set(document);
    }


    public async getMultiple(ids: string[]): Promise<Array<T>> {

        return (await this.getDocumentsForIds(ids)).documents;
    }


    /**
     * Implements {@link ReadDatastore#find}
     *
     *
     * Additional specs:
     *
     * Find sorts the documents by identifier ascending
     *
     * @param query
     * @param ignoreCategories to make queries faster, the facility to return only the
     *   categories the datastore is supposed to return, can be turned off. This can make sense if
     *   one performs constraint queries, where one knows that all documents returned are of
     *   allowed categories, due to the nature of the relations to which the constraints refer.
     * @throws if query contains categories incompatible with T
     */
    public async find(query: Query, ignoreCategories: boolean = false): Promise<IdaiFieldFindResult<T>> {

        const { ids } = this.findIds(query, ignoreCategories);
        const { documents, totalCount } = await this.getDocumentsForIds(ids, query.limit, query.offset);

        return {
            documents: documents,
            ids: ids,
            totalCount: totalCount,
            queryId: query.id
        }
    }


    public findIds(query: Query, ignoreCategories: boolean = false /* TODO review */): FindIdsResult {

        if (!query.categories && !ignoreCategories) {
            query = ObjectUtils.jsonClone(query);
            query.categories = undefined;
        }

        const orderedResults: string[] = this.getIds(query);

        return {
            ids: orderedResults,
            totalCount: orderedResults.length,
            queryId: query.id
        };
    }


    /**
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @throws [DOCUMENT_NOT_FOUND] - in case of error
     */
    public async getRevision(docId: string, revisionId: string): Promise<T> {

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
                                     offset?: number): Promise<{documents: Array<T>, totalCount: number}> {

        let totalCount: number = ids.length;
        let idsToFetch: string[] = ids;

        if (offset) idsToFetch.splice(0, offset);

        if (limit !== undefined) {
            if (limit === 0) return { documents: [], totalCount: totalCount };
            if (limit < idsToFetch.length) idsToFetch = idsToFetch.slice(0, limit);
        }

        const {documentsFromCache, notCachedIds} = await this.getDocumentsFromCache(idsToFetch);
        let documents: Array<T> = documentsFromCache;

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
            : Promise<{ documentsFromCache: Array<T>, notCachedIds: string[] }> {

        const documents: Array<T> = [];
        const notCachedIds: string[] = [];

        for (let id of ids) {
            const document: T = this.documentCache.get(id);
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


    private async getDocumentsFromDatastore(ids: string[]): Promise<Array<T>> {

        const documents: Array<T> = [];
        const result: Array<Document> = await this.datastore.bulkFetch(ids);

        result.forEach(document => {
            const convertedDocument: T = this.categoryConverter.convert(document);

            try {
                documents.push(this.documentCache.set(convertedDocument));
            } catch (errWithParams) {
                if (errWithParams[0] !== DatastoreErrors.UNKNOWN_CATEGORY /* TODO review where this has impact*/) throw errWithParams;
            }
        });

        return documents;
    }


    private mergeDocuments(documentsFromCache: Array<T>, documentsFromDatastore: Array<T>,
                           idsInOrder: string[]): Array<T> {

        const documents: Array<T> = documentsFromCache.concat(documentsFromDatastore);

        documents.sort((a: T, b: T) => {
            return idsInOrder.indexOf(a.resource.id) < idsInOrder.indexOf(b.resource.id)
                ? -1
                : 1;
        });

        return documents;
    }
}
