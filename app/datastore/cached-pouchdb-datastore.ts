import {Query} from 'idai-components-2/datastore';
import {Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {IdaiFieldDatastore} from './idai-field-datastore';
import {SyncState} from './sync-state';
import {PouchdbDatastore} from './pouchdb-datastore';

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CachedPouchdbDatastore implements IdaiFieldDatastore {

    private documentCache: { [resourceId: string]: Document } = {};
    private autoCacheUpdate: boolean = true;

    constructor(private datastore: PouchdbDatastore) {
        this.datastore.documentChangesNotifications()
            .subscribe(doc => {
                // explicitly assign by value in order for
                // changes to be detected by angular
                if (this.autoCacheUpdate && doc && doc.resource && this.documentCache[doc.resource.id]) {
                    console.debug('change detected', doc);
                    if (!doc['_conflicts']) delete this.documentCache[doc.resource.id]['_conflicts'];
                    Object.assign(this.documentCache[doc.resource.id], doc);
                }
            });
    }

    findConflicted() {
        return this.datastore.findConflicted();
    }

    create(document: Document): Promise<Document> {
        return this.datastore.create(document)
            .then(doc => {
                // working with the assumption that create returns the same instance of document as doc
                return this.documentCache[doc.resource.id] = doc
            });
    }

    update(document: Document): Promise<Document> {
        return this.datastore.update(document).then(doc => {
            // working with the assumption that update returns the same instance of document as doc
            return this.documentCache[doc.resource.id] = doc;
        });
    }

    remove(doc: Document): Promise<any> {
        return this.datastore.remove(doc)
            .then(() => delete this.documentCache[doc.resource.id]);
    }

    documentChangesNotifications(): Observable<Document> {
        return this.datastore.documentChangesNotifications();
    }

    get(id: string): Promise<Document> {
        if (this.documentCache[id]) {
            return Promise.resolve(this.documentCache[id]);
        }
        return this.datastore.fetch(id).then(doc => this.documentCache[id] = doc);
    }

    find(query: Query, offset?: number, limit?: number):Promise<Document[]> {
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

    refresh(doc: Document): Promise<Document> {
        return this.datastore.refresh(doc).then(result => {
            this.documentCache[doc.resource.id] = result as Document;
            return Promise.resolve(result);
        });
    }

    getLatestRevision(id: string): Promise<Document> {
        return this.datastore.fetch(id);
    }

    /**
     * Implements {@link IdaiFieldDatastore#getRevision}
     *
     * @param docId
     * @param revisionId
     * @returns {Promise<IdaiFieldDocument>}
     */
    getRevision(docId: string, revisionId: string): Promise<Document> {
        return this.datastore.fetch(docId, { rev: revisionId });
    }

    /**
     * Implements {@link IdaiFieldDatastore#getRevisionHistory}
     *
     * @param docId
     * @returns {Promise<Array<PouchDB.Core.RevisionInfo>>}
     */
    getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>> {
        return this.datastore.getRevisionHistory(docId);
    }

    /**
     * Implements {@link IdaiFieldDatastore#removeRevision}
     *
     * @param docId
     * @param revisionId
     * @returns {Promise<any>}
     */
    removeRevision(docId: string, revisionId: string): Promise<any> {
        return this.datastore.removeRevision(docId, revisionId);
    }

    setAutoCacheUpdate(autoCacheUpdate: boolean) {
        this.autoCacheUpdate = autoCacheUpdate;
    }
}
