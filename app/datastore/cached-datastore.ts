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

    constructor(private datastore:Datastore) { console.log("creating cached datastore") }

    create(doc: Document): Promise<Document|string> {
        return this.datastore.create(doc);
    }

    update(doc: Document): Promise<Document|string> {
        return this.datastore.update(doc);
    }

    remove(doc: Document): Promise<any|any> {
        return this.datastore.remove(doc);
    }

    documentChangesNotifications(): Observable<Document> {
        return this.datastore.documentChangesNotifications();
    }

    get(id: string): Promise<Document|string> {
        return this.datastore.get(id);
    }

    find(query: Query, fieldName?: string): Promise<Document[]|string> {
        return this.datastore.find(query,fieldName);
    }

    all(options: any): Promise<Document[]|string> {
        return this.datastore.all(options);
    }

    refresh(doc: Document): Promise<Document|string> {
        return this.datastore.refresh(doc);
    }

}