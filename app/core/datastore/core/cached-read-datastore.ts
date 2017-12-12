import {Injectable} from '@angular/core';
import {FindResult, Query, ReadDatastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {TypeConverter} from './type-converter';


export interface IdaiFieldFindResult<T extends Document> extends FindResult {

    documents: Array<T>
}


@Injectable()
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

    private autoCacheUpdate: boolean = true;


    constructor(
        protected datastore: PouchdbDatastore,
        protected documentCache: DocumentCache<T>,
        protected typeConverter: TypeConverter,
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
        this.typeConverter.validate([document.resource.type], this.typeClass);

        return this.documentCache.set(this.typeConverter.convert<T>(document));
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

        query.types = this.typeConverter.validate(query.types, this.typeClass);

        const ids: string[] = await this.datastore.findIds(query);

        const {docs, failures} = await this.getDocumentsForIds(ids, query.limit);
        return {
            documents: docs,
            totalCount: ids.length - failures
        };
    }


    /**
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @throws [DOCUMENT_NOT_FOUND] - in case of error
     */
    public async getRevision(docId: string, revisionId: string): Promise<T> {

        return this.typeConverter.convert<T>(
            await this.datastore.fetchRevision(docId, revisionId));
    }


    public async getConflictedRevisions(docId: string): Promise<Array<T>> {

        return (await this.datastore.fetchConflictedRevisions(docId))
            .map(document => this.typeConverter.convert<T>(document));
    }


    public setAutoCacheUpdate(autoCacheUpdate: boolean) {

        this.autoCacheUpdate = autoCacheUpdate;
    }


    private async getDocumentsForIds(ids: string[], limit?: number):
        Promise<{docs:Array<T>, failures: number}> {

        const docs: Array<T> = [];
        let failures = 0;
        let i = 0;
        for (let id of ids) {
            try {
                docs.push(await this.get(id));
                i++;
                if ((limit) && (limit == i)) break;
            } catch (e) {
                failures++;
                console.error('tried to fetch indexed document, ' +
                    'but document is either non existent or invalid. id: '+id);
            }
        }
        return {
            docs: docs,
            failures: failures
        };
    }
}
