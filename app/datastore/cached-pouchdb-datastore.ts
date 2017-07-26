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
        return this.datastore.get(id).then(doc => this.documentCache[id] = doc);
    }

    find(query: Query, offset?: number, limit?: number):Promise<Document[]> {

        return this.datastore.find(query, offset, limit)
            .then(result => this.replaceAllWithCached(result));
    }

    all(type?:string, offset?:number, limit?:number): Promise<Document[]> {
        return this.datastore.all(type, offset, limit)
            .then(result => this.replaceAllWithCached(result));
    }

    private replaceAllWithCached(results) {
        let results_ = [];
        for (let result of results) {
            results_.push(this.replaceWithCached(result));
        }
        return results_;
    }

    private replaceWithCached(result) {
        if (!result)
            return result;
        else if (this.documentCache[result.resource.id])
            return this.documentCache[result.resource.id];
        else
            return this.documentCache[result.resource.id] = result;
    }

    refresh(doc: Document): Promise<Document> {
        return this.datastore.refresh(doc).then(result => {
            this.documentCache[doc.resource.id] = result as Document;
            return Promise.resolve(result);
        });
    }

    setupSync(url: string): Promise<SyncState> {
        return this.datastore.setupSync(url);
    }

    stopSync() {
        return this.datastore.stopSync();
    }

    getLatestRevision(id: string): Promise<Document> {
        return this.datastore.get(id);
    }

    getRevision(docId: string, revisionId: string): Promise<Document> {
        return this.datastore.getRevision(docId, revisionId);
    }

    getRevisionHistory(docId: string): Promise<Array<PouchDB.Core.RevisionInfo>> {
        return this.datastore.getRevisionHistory(docId);
    }

    removeRevision(docId: string, revisionId: string): Promise<any> {
        return this.datastore.removeRevision(docId, revisionId);
    }

    setAutoCacheUpdate(autoCacheUpdate: boolean) {
        this.autoCacheUpdate = autoCacheUpdate;
    }
}
