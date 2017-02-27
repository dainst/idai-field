import {Datastore,Query} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CachedDatastore implements Datastore {

    private documentCache: { [resourceId: string]: Document } = {};

    constructor(private datastore:Datastore) { }

    create(document: Document): Promise<Document|string> {
        return this.datastore.create(document).then(doc => {
            let d = doc as Document;
            this.documentCache[d.resource.id] = d;
            return Promise.resolve(d);
        })
    }

    update(document: Document): Promise<Document|string> {
        return this.datastore.update(document).then(doc => {
            let d = doc as Document;
            this.documentCache[d.resource.id] = d;
            return Promise.resolve(d);
        })
    }

    remove(doc: Document): Promise<any|any> {
        return this.datastore.remove(doc).then(() => {
            delete this.documentCache[doc.resource.id];
        })
    }

    documentChangesNotifications(): Observable<Document> {
        return this.datastore.documentChangesNotifications();
    }

    get(id: string): Promise<Document|string> {
        if (this.documentCache[id]) {
            return Promise.resolve(this.documentCache[id]);
        }
        return this.datastore.get(id);
    }

    find(query: Query, fieldName?: string): Promise<Document[] | string> {
        return this.datastore.find(query,fieldName).then(results => {
            return Promise.resolve(this.replaceWithCached(results));
        })
    }

    private replaceWithCached(results) {
        let results_ = [];
        for (let result of results) {
            if (this.documentCache[result.resource.id]) {
                results_.push(this.documentCache[result.resource.id]);
            }
            else {
                this.documentCache[result.resource.id] = result;
                results_.push(result);
            }
        }
        return results_;
    }

    all(): Promise<Document[]|string> {
        return this.datastore.all();
    }

    refresh(doc: Document): Promise<Document|string> {
        return this.datastore.refresh(doc).then(result => {
            this.documentCache[doc.resource.id] = result as Document;
            return Promise.resolve(result);
        });
    }

}