import {Query} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {IdaiFieldDatastore} from "./idai-field-datastore";

@Injectable()
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class CachedDatastore implements IdaiFieldDatastore {

    private documentCache: { [resourceId: string]: Document } = {};

    constructor(private datastore:IdaiFieldDatastore) {
        this.datastore.documentChangesNotifications()
            .subscribe(doc => {
                console.log("change detected", doc);
                // explicitly assign by value in order for
                // changes to be detected by angular
                Object.assign(this.documentCache[doc.resource.id], doc);
            });
    }

    create(document: Document): Promise<Document> {
        return this.datastore.create(document).then(doc => {
            let d = doc as Document;
            return Promise.resolve(d);
        });
    }

    update(document: Document): Promise<Document> {
        return this.datastore.update(document).then(doc => {
            let d = doc as Document;
            return Promise.resolve(d);
        });
    }

    remove(doc: Document): Promise<any> {
        return this.datastore.remove(doc).then(() => {
            delete this.documentCache[doc.resource.id];
        });
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

    findByIdentifier(identifier: string): Promise<Document> {
        return this.datastore.findByIdentifier(identifier)
            .then(result => this.replaceWithCached(result));
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

}