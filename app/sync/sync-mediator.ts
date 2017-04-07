import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Datastore} from "idai-components-2/datastore";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class SyncMediator {

    private observers = [];

    constructor(
        private datastore: IdaiFieldDatastore
    ){
        this.datastore.documentChangesNotifications().subscribe(
            document=>{
                for (let obs of this.observers) {
                    if (document['synced']!==1)
                        obs.next(document);
                }
            },
            (err)=>console.log("err in syncmediator",err)
        );
    };

    public getUnsyncedDocuments(): Observable<Document> {
        return Observable.create( observer => {

            this.datastore.findUnsynced().then(result=>{
               console.log("sync mediator got",result)
            });
            // this.db.then(db => {
            //     var cursor = db.openCursor("idai-field-object","synced",IDBKeyRange.only(0));
            //     cursor.onsuccess = (event) => {
            //         var cursor = event.target.result;
            //         if (cursor) {
            //             this.datastore.get(cursor.value['resource']['id']).then(
            //                 possiblyCachedDocFromDS=>{
            //                     observer.next(possiblyCachedDocFromDS);
            //             });
            //             cursor.continue();
            //         } else {
                        this.observers.push(observer);
                    // }
                // };
                // cursor.onerror = err => observer.onError(cursor.error);
            // });
        });
    }
}