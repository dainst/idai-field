import {jsonClone} from 'tsfun';
import {FindResult, Query, ReadDatastore, DatastoreErrors, Document} from 'idai-components-2';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';
import {IndexFacade} from '../index/index-facade';


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
 *    IdaiFieldDocument and IdaiFieldImageDocument respectively,
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
     * @param options.skip_cache: boolean
     * @throws if fetched doc is not of type T, determined by resource.type
     */
    public async get(id: string, options?: { skip_cache: boolean }): Promise<T> {

        if ((!options || !options.skip_cache) && this.documentCache.get(id)) {
            return this.documentCache.get(id);
        }

        const document = await this.datastore.fetch(id);
        this.typeConverter.validateTypeToBeOfClass(document.resource.type, this.typeClass);

        return this.documentCache.set(this.typeConverter.convert(document));
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
                this.typeConverter.validateTypeToBeOfClass(type, this.typeClass);
            });
        } else {
            clonedQuery.types = this.typeConverter.getTypesForClass(this.typeClass);
        }

        const {documents, totalCount} = await this.getDocumentsForIds(this.findIds(clonedQuery), clonedQuery.limit);

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
    private findIds(query: Query): string[] {

        try {
            return this.indexFacade.perform(query);
        } catch (err) {
            throw [DatastoreErrors.GENERIC_ERROR, err];
        }
    }


    private async getDocumentsForIds(ids: string[],
                                     limit?: number): Promise<{documents: Array<T>, totalCount: number}> {

        let idsToFetch: string[] = ids;
        if (limit && limit < idsToFetch.length) idsToFetch = idsToFetch.slice(0, limit);
        let totalCount = ids.length;

        const {documentsFromCache, notCachedIds} = await this.getDocumentsFromCache(idsToFetch);
        let documents: Array<T> = documentsFromCache;

        if (notCachedIds.length > 0) {
            try {
                const {documentsFromDatastore, notFound} = await this.getDocumentsFromDatastore(notCachedIds);
                totalCount -= notFound;
                documents = this.mergeDocuments(documentsFromCache, documentsFromDatastore, idsToFetch);
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


    private async getDocumentsFromDatastore(ids: string[])
            : Promise<{ documentsFromDatastore: Array<T>, notFound: number }> {

        const documents: Array<T> = [];
        let notFound: number = 0;

        const result: any = await this.datastore.fetchMultiple(ids);

        for (let row of result.rows) {
            if (row.error) {
                notFound++;
                continue;
            }
            this.typeConverter.validateTypeToBeOfClass(row.doc.resource.type, this.typeClass);
            documents.push(this.documentCache.set(this.typeConverter.convert(row.doc)));
        }

        return {
            documentsFromDatastore: documents,
            notFound: notFound
        };
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
