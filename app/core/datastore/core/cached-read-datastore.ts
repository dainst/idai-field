import {DocumentChange, Query, ReadDatastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from "./document-cache";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DocumentConverter} from './document-converter';


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
export abstract class CachedReadDatastore<T extends Document>
    implements ReadDatastore {


    private autoCacheUpdate: boolean = true;


    constructor(
        protected datastore: PouchdbDatastore,
        protected documentCache: DocumentCache<T>,
        protected documentConverter: DocumentConverter,
        private typeClassName: string) {

        console.debug('constructing cached datastore for '+typeClassName);


        this.datastore.documentChangesNotifications().subscribe(documentChange => {

            if (documentChange.type != 'changed') return;

            const document = documentChange.document;

            // explicitly assign by value in order for changes to be detected by angular
            if (this.autoCacheUpdate && document && document.resource &&
                this.documentCache.get(document.resource.id as any)) {
                console.debug('change detected', document);
                this.reassign(this.documentConverter.
                convertToIdaiFieldDocument<T>(document));
            }
        });
    }


    // TODO we must not delegate the call but instead return a new Observable. Then we notify from within the subscription made in the constructors. This is necessary in order to make sure clients always get fully checked instances of IdaiFieldDocuments. Add unit test for it.
    public documentChangesNotifications(): Observable<DocumentChange> {

        return this.datastore.documentChangesNotifications();
    }



    /**
     * Implements {@link ReadDatastore#get}
     *
     * It supports the following options
     * not specified in ReadDatastore:  { skip_cache: boolean }
     *
     * @param {string} id
     * @param {{skip_cache: boolean}} options
     * @returns {Promise<T extends Document>}
     */
    public async get(id: string, options?: {skip_cache: boolean}): Promise<T> {

        if ((!options || !options.skip_cache) && this.documentCache.get(id)) {
            return this.documentCache.get(id);
        }

        return this.documentCache.set(this.documentConverter.convertToIdaiFieldDocument<T>(
            await this.datastore.fetch(id)));
    }


    /**
     * Implements {@link ReadDatastore#find}
     *
     * @param query
     * @returns {Promise<IdaiFieldDocument[]>}
     */
    public async find(query: Query):Promise<T[]> {

        const result = await this.replaceAllWithCached(await this.datastore.findIds(query));
        return result;
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


    protected replaceAllWithCached(results: any) {

        let ps = [];
        for (let id of results) {
            ps.push(this.get(id));
        }
        return Promise.all(ps);
    }
}
