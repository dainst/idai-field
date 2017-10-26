import {Query, DocumentChange} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IdaiFieldDatastore} from './idai-field-datastore';
import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from "./document-cache";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model'
import {IdaiFieldReadDatastore} from './idai-field-read-datastore';

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CachedPouchdbDatastore implements
    IdaiFieldDatastore, IdaiFieldReadDatastore {


    private autoCacheUpdate: boolean = true;


    constructor(private datastore: PouchdbDatastore, private documentCache: DocumentCache) {

        this.datastore.documentChangesNotifications()
            .subscribe(documentChange => {

                if (documentChange.type == 'changed') {
                    const document = documentChange.document;

                    // explicitly assign by value in order for changes to be detected by angular
                    if (this.autoCacheUpdate && document && document.resource && this.documentCache.get(document.resource.id as any)) {
                        console.debug('change detected', document);
                        this.reassign(document as IdaiFieldDocument); // TODO check if all declared fields exist on upcast
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
    public create(document: Document): Promise<Document> {

        return this.datastore.create(document)
            .then(createdDocument => this.documentCache.set(createdDocument));
    }


    /**
     * Implements {@link IdaiFieldDatastore#update}
     *
     * @param document
     * @returns
     */
    public update(document: Document): Promise<Document> {

        return this.datastore.update(document)
            .then(updatedDocument => {
                if (!this.documentCache.get(document.resource.id as any)) {
                    return this.documentCache.set(updatedDocument);
                } else {
                    this.reassign(updatedDocument as IdaiFieldDocument);
                    return this.documentCache.get(document.resource.id as any);
                }
        });
    }


    public remove(doc: Document): Promise<any> {

        return this.datastore.remove(doc)
            .then(() => this.documentCache.remove(doc.resource.id));
    }


    public documentChangesNotifications(): Observable<DocumentChange> {

        return this.datastore.documentChangesNotifications();
    }


    // TODO upcast Document from datastore to IdaiFieldDocument and check if all declared fields exist
    public get(id: string, options?: Object): Promise<IdaiFieldDocument> {

        if ((!options || !(options as any)['skip_cache']) && this.documentCache.get(id)) {
            return Promise.resolve(this.documentCache.get(id));
        }
        return this.datastore.fetch(id).then(doc => this.documentCache.set(doc));
    }


    // TODO upcast Document[] from datastore to IdaiFieldDocument[] and check if all declared fields exist on every document
    /**
     * Implements {@link ReadDatastore#find}
     *
     * @param query
     * @returns {Promise<TResult2|TResult1>}
     */
    public find(query: Query):Promise<IdaiFieldDocument[]> {

        return this.datastore.findIds(query)
            .then(result => this.replaceAllWithCached(result));
    }


    private replaceAllWithCached(results: any) {

        let ps = [];
        for (let id of results) {
            ps.push(this.get(id));
        }
        return Promise.all(ps);
    }


    // TODO upcast Document from datastore to IdaiFieldDocument and check if all declared fields exist
    /**
     * Implements {@link IdaiFieldDatastore#getRevision}
     *
     * @param docId
     * @param revisionId
     * @returns {Promise<IdaiFieldDocument>}
     */
    public getRevision(docId: string, revisionId: string): Promise<IdaiFieldDocument> {

        return this.datastore.fetchRevision(docId, revisionId);
    }


    /**
     * Implements {@link IdaiFieldDatastore#removeRevision}
     *
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
}
