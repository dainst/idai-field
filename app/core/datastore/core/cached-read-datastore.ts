import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Query, ReadDatastore, FindResult} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from './document-cache';
import {DocumentConverter} from './document-converter';


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
        protected documentConverter: DocumentConverter,
        protected typeClass: string) {

        this.datastore.remoteChangesNotifications().subscribe(document => {

            if (!this.autoCacheUpdate) return;
            if (!document || !document.resource || !this.documentCache.get(document.resource.id as any)) return;

            // explicitly assign by value in order for changes to be detected by angular
            this.reassign(this.documentConverter.
                convertToIdaiFieldDocument<T>(document));
        });
    }


    public allChangesAndDeletionsNotifications(): Observable<void> {

        return this.datastore.allChangesAndDeletionsNotifications();
    }


    // TODO we must not delegate the call but instead return a new Observable. Then we notify from within the subscription made in the constructors. This is necessary in order to make sure clients always get fully checked instances of IdaiFieldDocuments. Add unit test for it.
    public remoteChangesNotifications(): Observable<Document> {

        return this.datastore.remoteChangesNotifications();
    }


    /**
     * Implements {@link ReadDatastore#get}
     *
     * It supports the following options
     * not specified in ReadDatastore:  { skip_cache: boolean }
     *
     * @throws if fetched doc is not of type T, determined by resource.type
     */
    public async get(id: string, options?: { skip_cache: boolean }): Promise<T> {

        if ((!options || !options.skip_cache) && this.documentCache.get(id)) {
            return this.documentCache.get(id);
        }

        const document = await this.datastore.fetch(id);
        this.documentConverter.validate([document.resource.type], this.typeClass);

        return this.documentCache.set(this.documentConverter.
            convertToIdaiFieldDocument<T>(document));
    }


    /**
     * find(query: Query):Promise<T[]>;
     *
     * In addition to {@link ReadDatastore#find}, {@link CachedReadDatastore#find}
     * has some extra specifications:
     *
     * find returns the documents in order.
     * It sorts the objects by lastModified (as per the modified array) descending.
     * If two documents have the exact same lastModified, there is no second sort criterium
     * so the order between them is unspecified.
     *
     * @throws if query contains types incompatible with T
     */
    public async find(query: Query): Promise<IdaiFieldFindResult<T>> {

        query.types = this.documentConverter.validate(query.types, this.typeClass);

        const ids: string[] = await this.datastore.findIds(query);
        const documents: Array<T> = await this.getDocumentsForIds(ids, query.limit);

        return {
            documents: documents,
            totalCount: ids.length
        };
    }


    /**
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @param docId
     * @param revisionId
     * @returns
     *   Rejects with
     *     [DOCUMENT_NOT_FOUND] - in case of error
     */
    public async getRevision(docId: string, revisionId: string): Promise<T> {

        return this.documentConverter.convertToIdaiFieldDocument<T>(
            await this.datastore.fetchRevision(docId, revisionId));
    }


    public setAutoCacheUpdate(autoCacheUpdate: boolean) {

        this.autoCacheUpdate = autoCacheUpdate;
    }


    protected reassign(doc: T) {

        if (!(doc as any)['_conflicts']) delete (this.documentCache.get(doc.resource.id as any)as any)['_conflicts'];
        Object.assign(this.documentCache.get(doc.resource.id as any), doc);
    }


    protected getDocumentsForIds(ids: string[], limit?: number): Promise<Array<T>> {

        const _ids = limit? ids.slice(0, limit) : ids;
        
        return Promise.all(_ids.map(id => this.get(id)));
    }
}
