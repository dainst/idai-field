import {jsonClone} from 'tsfun';
import {FindResult, Query, ReadDatastore, DatastoreErrors, Document} from 'idai-components-2';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';
import {IndexItem} from '../index/index-item';


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
 *    FieldDocument and ImageDocument respectively,
 *    so that the rest of the app can rely that the declared
 *    fields are present.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export abstract class CachedReadDatastore<T extends Document> implements ReadDatastore {

    public suppressWait = false;

    constructor(protected datastore: PouchdbDatastore,
                protected indexFacade: IndexFacade,
                protected documentCache: DocumentCache<T>,
                protected typeConverter: TypeConverter<T>,
                protected typeClass: string) { }


    /**
     * Implements {@link ReadDatastore#get}
     *
     * Additional specs:
     *
     * @param options.skipCache: boolean
     * @throws if fetched doc is not of type T, determined by resource.type
     */
    public async get(id: string, options?: { skipCache: boolean }): Promise<T> {

        const cachedDocument: T = this.documentCache.get(id);

        if ((!options || !options.skipCache) && cachedDocument) {
            return cachedDocument;
        }

        let document: T = await this.datastore.fetch(id) as T;
        this.typeConverter.assertTypeToBeOfClass(document.resource.type, this.typeClass);
        document = this.typeConverter.convert(document);

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
     * Additional specs:
     *
     * Find sorts the documents by identifier ascending
     *
     * @throws if query contains types incompatible with T
     */
    public async find(query: Query): Promise<IdaiFieldFindResult<T>> {

        if (!this.suppressWait) await this.datastore.ready();

        const clonedQuery: Query = jsonClone(query);

        if (clonedQuery.types) {
            clonedQuery.types.forEach(type => {
                this.typeConverter.assertTypeToBeOfClass(type, this.typeClass);
            });
        } else {
            clonedQuery.types = this.typeConverter.getTypesForClass(this.typeClass);
        }

        const {documents, totalCount} = await this.getDocumentsForIds(await this.findIds(clonedQuery), clonedQuery.limit);

        return {
            documents: documents,
            totalCount: totalCount,
            queryId: query.id
        }
    }


    /**
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @throws [DOCUMENT_NOT_FOUND] - in case of error
     */
    public async getRevision(docId: string, revisionId: string): Promise<T> {

        return this.typeConverter.convert(
            await this.datastore.fetchRevision(docId, revisionId));
    }


    /**
     * @param query
     * @return an array of the resource ids of the documents the query matches.
     *   the sort order of the ids is determinded in that way that ids of documents with newer modified
     *   dates come first. they are sorted by last modfied descending, so to speak.
     *   if two or more documents have the same last modifed date, their sort order is unspecified.
     *   the modified date is taken from document.modified[document.modified.length-1].date
     */
    private async findIds(query: Query): Promise<string[]> {

        let result: any;
        try {
            result = this.indexFacade.perform(query);
        } catch (err) {
            return Promise.reject([DatastoreErrors.GENERIC_ERROR, err]);
        }

        // Wrap asynchronously in order to make the app more responsive
        return new Promise<string[]>((resolve: any, reject: any) => {
            let orderedResult;
            try {
                orderedResult = IndexItem.generateOrderedResultList(result);
                resolve(orderedResult);
            } catch (err) {
                reject([DatastoreErrors.GENERIC_ERROR, err]);
            }
        });
    }


    private async getDocumentsForIds(ids: string[],
                                     limit?: number): Promise<{documents: Array<T>, totalCount: number}> {

        let totalCount: number = ids.length;
        let idsToFetch: string[] = ids;
        if (limit && limit < idsToFetch.length) idsToFetch = idsToFetch.slice(0, limit);

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
            this.typeConverter.assertTypeToBeOfClass(document.resource.type, this.typeClass);
            documents.push(this.documentCache.set(this.typeConverter.convert(document)));
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
