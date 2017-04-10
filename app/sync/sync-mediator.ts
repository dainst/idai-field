import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {IdaiFieldDatastore} from "../datastore/idai-field-datastore";
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 * The sync mediator acts as a proxy to the datastores documentChangesNotifications functionality,
 * extending it by the ability to include previously unsynced documents when notifying its observers.
 *
 * @author Daniel de Oliveira
 */
export class SyncMediator {

    private observers = [];

    constructor(
        private datastore: IdaiFieldDatastore
    ){
        this.datastore.documentChangesNotifications().subscribe(
            document => this.notify(document),
            (err) => console.log("err in syncmediator",err)
        );
    };

    private notify(document) {
        for (let obs of this.observers) {
            if (document['synced']!==1) obs.next(document);
        }
    }

    public getUnsyncedDocuments(): Observable<Document> {
        return Observable.create( observer => {

            this.observers.push(observer);
            this.datastore.findUnsynced().then(docs => {
                for (let doc of docs) this.notify(doc);
            });
        });
    }
}