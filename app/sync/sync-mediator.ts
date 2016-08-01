import {Injectable, Inject} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Indexeddb} from "../datastore/indexeddb"
import {Datastore} from "idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class SyncMediator {

    private db:Promise<any>;
    private observers = [];

    constructor(
        private idb:Indexeddb,
        private datastore:Datastore
    ){
        this.db=idb.db();

        this.datastore.documentChangesNotifications().subscribe(
            document=>{
                for (var obs of this.observers) {
                    if (document['synced']!==1)
                        obs.next(document);
                }
            },
            (err)=>console.log("err in syncmediator",err)
        );
    };

    public getUnsyncedDocuments(): Observable<Document> {
        return Observable.create( observer => {
            this.db.then(db => {
                var cursor = db.openCursor("idai-field-object","synced",IDBKeyRange.only(0));
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        this.datastore.get(cursor.value['resource']['id']).then(
                            possiblyCachedDocFromDS=>{
                                observer.next(possiblyCachedDocFromDS);
                        });
                        cursor.continue();
                    } else {
                        this.observers.push(observer);
                    }
                };
                cursor.onerror = err => observer.onError(cursor.error);
            });
        });
    }
}