import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IdaiFieldDatastore} from './idai-field-datastore';

import {PouchdbDatastore} from './pouchdb-datastore';
import {DocumentCache} from "./document-cache";

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CachedPouchdbDatastore implements IdaiFieldDatastore {

    private autoCacheUpdate: boolean = true;

    constructor(private datastore: PouchdbDatastore, private documentCache: DocumentCache) {
        this.datastore.documentChangesNotifications()
            .subscribe(doc => {
                // explicitly assign by value in order for
                // changes to be detected by angular
                if (this.autoCacheUpdate && doc && doc.resource && this.documentCache.get(doc.resource.id)) {
                    console.debug('change detected', doc);
                    if (!doc['_conflicts']) delete this.documentCache.get(doc.resource.id)['_conflicts'];
                    Object.assign(this.documentCache.get(doc.resource.id), doc);
                }
            });
    }

    public findConflicted() {

        return this.datastore.findConflicted();
    }

    /**
     * Implements {@link IdaiFieldDatastore#create}
     *
     * @param document
     * @returns
     */
    public create(document: Document): Promise<Document> {

        return this.datastore.create(document)
            // knowing that create returns the same instance of document as doc
            .then(doc => this.documentCache.set(doc));
    }

    /**
     * Implements {@link IdaiFieldDatastore#update}
     *
     * @param document
     * @returns
     */
    public update(document: Document): Promise<Document> {

        return this.datastore.update(document)
            // knowing that update returns the same instance of document as doc
            .then(doc => this.documentCache.set(doc));
    }

    public remove(doc: Document): Promise<any> {

        return this.datastore.remove(doc)
            .then(() => this.documentCache.remove(doc.resource.id));
    }

    public documentChangesNotifications(): Observable<Document> {

        return this.datastore.documentChangesNotifications();
    }

    public get(id: string): Promise<Document> {

        if (this.documentCache.get(id)) {
            return Promise.resolve(this.documentCache.get(id));
        }
        return this.datastore.fetch(id).then(doc => this.documentCache.set(doc));
    }

    public find(query: Query, offset?: number, limit?: number):Promise<Document[]> {

        if (offset) console.warn('offset not implemented for this datastore',query);
        if (limit) console.warn('limit not implemented for this datastore',query);

        return this.datastore.findIds(query)
            .then(result => {
                return this.replaceAllWithCached(result)
            });
    }

    private replaceAllWithCached(results) {

        let ps = [];
        for (let id of results) {
            ps.push(this.get(id));
        }
        return Promise.all(ps);
    }

    public refresh(doc: Document): Promise<Document> {

        return this.datastore.fetch(doc.resource.id).then(result => {
            this.documentCache.set(result);
            return Promise.resolve(result);
        });
    }

    public getLatestRevision(id: string): Promise<Document> {

        return this.datastore.fetch(id);
    }

    /**
     * Implements {@link IdaiFieldDatastore#getRevision}
     *
     * @param docId
     * @param revisionId
     * @returns {Promise<IdaiFieldDocument>}
     */
    public getRevision(docId: string, revisionId: string): Promise<Document> {

        return this.datastore.fetch(docId, { rev: revisionId });
    }

    /**
     * Implements {@link IdaiFieldDatastore#getRevisionHistory}
     *
     * @param docId
     * @returns {Promise<Array<PouchDB.Core.RevisionInfo>>}
     */
    public getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>> {

        return this.datastore.getRevisionHistory(docId);
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
}
