import {Query, DocumentChange, Datastore} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {PouchdbDatastore} from './core/pouchdb-datastore';
import {DocumentCache} from "./idai-field-document-cache";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model'
import {IdaiFieldReadDatastore} from './idai-field-read-datastore';

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
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldDatastore implements IdaiFieldReadDatastore, Datastore {


    private autoCacheUpdate: boolean = true;


    constructor(private datastore: PouchdbDatastore, private documentCache: DocumentCache) {

        this.datastore.documentChangesNotifications()
            .subscribe(documentChange => {

                if (documentChange.type == 'changed') {
                    const document = documentChange.document;

                    // explicitly assign by value in order for changes to be detected by angular
                    if (this.autoCacheUpdate && document && document.resource &&
                            this.documentCache.get(document.resource.id as any)) {
                        console.debug('change detected', document);
                        this.reassign(IdaiFieldDatastore.
                            convertToIdaiFieldDocument(document));
                    }
                }

            });
    }


    /**
     * Implements {@link IdaiFieldDatastore#create}
     *
     * @param document
     * @returns
     */
    public async create(document: Document): Promise<Document> {

        const createdDocument = await this.datastore.create(document);
        return this.documentCache.set(IdaiFieldDatastore.
            convertToIdaiFieldDocument(createdDocument));
    }


    /**
     * Implements {@link IdaiFieldDatastore#update}
     *
     * @param document
     * @returns
     */
    public async update(document: Document): Promise<Document> {

        const updatedDocument = await this.datastore.update(document);

        if (!this.documentCache.get(document.resource.id as any)) {

            return this.documentCache.set(IdaiFieldDatastore.
                convertToIdaiFieldDocument(updatedDocument));

        } else {

            this.reassign(IdaiFieldDatastore.convertToIdaiFieldDocument(
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



    public async get(id: string, options?: {skip_cache: boolean}): Promise<IdaiFieldDocument> {

        if ((!options || !options.skip_cache) && this.documentCache.get(id)) {
            return this.documentCache.get(id);
        }

        return this.documentCache.set(IdaiFieldDatastore.convertToIdaiFieldDocument(
            await this.datastore.fetch(id)));
    }


    /**
     * Implements {@link IdaiFieldReadDatastore#find}
     *
     * @param query
     * @returns {Promise<IdaiFieldDocument[]>}
     */
    public async find(query: Query):Promise<IdaiFieldDocument[]> {

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
    public async getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument> {

        return IdaiFieldDatastore.convertToIdaiFieldDocument(
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


    private reassign(doc: IdaiFieldDocument) {

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


    private static convertToIdaiFieldDocument(doc: Document): IdaiFieldDocument {

        const document = doc as IdaiFieldDocument;

        if (!document.resource.identifier) document.resource.identifier = '';
        if (!document.resource.relations.isRecordedIn) document.resource.relations.isRecordedIn = [];

        return document;
    }
}
