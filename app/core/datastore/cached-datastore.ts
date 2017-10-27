import {Query, DocumentChange, Datastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from "./document-cache";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model'
import {IdaiFieldReadDatastore} from './idai-field-read-datastore';
import {ImageTypeUtility} from '../../common/image-type-utility';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';


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
 * 2) Returns fully checked instances of IdaiFieldDocument, so that the rest
 *    of the app can rely that the declared fields are present.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class CachedDatastore<T extends Document>
    implements IdaiFieldReadDatastore<T>, Datastore {


    private autoCacheUpdate: boolean = true;


    constructor(
        private datastore: PouchdbDatastore,
        private documentCache: DocumentCache<T>,
        private imageTypeUtility: ImageTypeUtility) {

        this.datastore.documentChangesNotifications().subscribe(documentChange => {

            if (documentChange.type != 'changed') return;

            const document = documentChange.document;

            // explicitly assign by value in order for changes to be detected by angular
            if (this.autoCacheUpdate && document && document.resource &&
                    this.documentCache.get(document.resource.id as any)) {
                console.debug('change detected', document);
                this.reassign(this.
                    convertToIdaiFieldDocument(document));
            }
        });
    }


    /**
     * Implements {@link CachedDatastore#create}
     *
     * @param document
     * @returns
     */
    public async create(document: Document): Promise<Document> {

        const createdDocument = await this.datastore.create(document);
        return this.documentCache.set(this.
            convertToIdaiFieldDocument(createdDocument));
    }


    /**
     * Implements {@link CachedDatastore#update}
     *
     * @param document
     * @returns
     */
    public async update(document: Document): Promise<Document> {

        const updatedDocument = await this.datastore.update(document);

        if (!this.documentCache.get(document.resource.id as any)) {

            return this.documentCache.set(this.
                convertToIdaiFieldDocument(updatedDocument));

        } else {

            this.reassign(this.convertToIdaiFieldDocument(
                updatedDocument));
            return this.documentCache.get(document.resource.id as any);
        }
    }


    public remove(doc: Document): Promise<any> {

        return this.datastore.remove(doc)
            .then(() => this.documentCache.remove(doc.resource.id));
    }

    // TODO we must not delegate the call but instead return a new Observable. Then we notify from within the subscription made in the constructors. This is necessary in order to make sure clients always get fully checked instances of IdaiFieldDocuments. Add unit test for it.
    public documentChangesNotifications(): Observable<DocumentChange> {

        return this.datastore.documentChangesNotifications();
    }



    public async get(id: string, options?: {skip_cache: boolean}): Promise<T> {

        if ((!options || !options.skip_cache) && this.documentCache.get(id)) {
            return this.documentCache.get(id);
        }

        return this.documentCache.set(this.convertToIdaiFieldDocument(
            await this.datastore.fetch(id)));
    }


    /**
     * Implements {@link IdaiFieldReadDatastore#find}
     *
     * @param query
     * @returns {Promise<IdaiFieldDocument[]>}
     */
    public async find(query: Query):Promise<T[]> {

        return this.replaceAllWithCached(await this.datastore.findIds(query));
    }


    /**
     * Implements {@link IdaiFieldReadDatastore#getRevision}
     *
     * Fetches a specific revision directly from the underlying datastore layer.
     * Bypasses the cache and alway returns a new instance.
     *
     * @param docId
     * @param revisionId
     * @returns {Promise<IdaiFieldDocument>}
     */
    public async getRevision(docId: string, revisionId: string): Promise<T> {

        return this.convertToIdaiFieldDocument(
            await this.datastore.fetchRevision(docId, revisionId));
    }


    /**
     * @param docId
     * @param revisionId
     * @returns {Promise<any>}
     */
    public removeRevision(docId: string, revisionId: string): Promise<any> {

        return this.datastore.removeRevision(docId, revisionId);
    }


    public setAutoCacheUpdate(autoCacheUpdate: boolean) {

        this.autoCacheUpdate = autoCacheUpdate;
    }


    private reassign(doc: T) {

        if (!(doc as any)['_conflicts']) delete (this.documentCache.get(doc.resource.id as any)as any)['_conflicts'];
        Object.assign(this.documentCache.get(doc.resource.id as any), doc);
    }


    private replaceAllWithCached(results: any) {

        let ps = [];
        for (let id of results) {
            ps.push(this.get(id));
        }
        return Promise.all(ps);
    }


    private convertToIdaiFieldDocument(doc: Document): T {

        if (this.imageTypeUtility.isImageType(doc.resource.type)) {
            const d = doc as IdaiFieldImageDocument;
            if (!d.resource.identifier) d.resource.identifier = '';
            if (!d.resource.relations.depicts) d.resource.relations.depicts = [];
        } else {
            const d = doc as IdaiFieldDocument;
            if (!d.resource.identifier) d.resource.identifier = '';
            if (!d.resource.relations.isRecordedIn) d.resource.relations.isRecordedIn = [];
        }

        return doc as T;
    }
}
