import {Component, Inject, OnInit} from 'angular2/core';
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
@Component({

    selector: 'synchronization',
    templateUrl: 'templates/synchronization.html'
})

export class SynchronizationComponent implements OnInit {

    private connected: boolean;
    private objectsToSyncIds: string[] = [];

    constructor(private idaiFieldBackend: IdaiFieldBackend,
        private datastore: Datastore) {}

    ngOnInit() {

        this.setupConnectionCheck();
        this.setupSync();
    }

    private setupConnectionCheck() {

        this.idaiFieldBackend.isConnected().subscribe(
            connected => {
                this.connected = connected;
                if (connected) this.syncAll();
            }
        );
    }

    private setupSync() {

        this.datastore.getUnsyncedObjects().subscribe(
            object => {
                if (this.connected) this.sync(object);
                else this.storeObjectId(object.id);
            },
            err => console.error("Could not fetch unsynced objects", err)
        );
    }

    private sync(object: IdaiFieldObject) {

        this.idaiFieldBackend.save(object).then(
            object => {
                object.synced = 1;
                this.datastore.update(object);
                this.removeObjectId(object.id);
                console.log("Successfully synced object", object);
            },
            err => console.error("Synchronization failed", err, object)
        );
    }

    private syncAll() {

        this.objectsToSyncIds.forEach(id => {
            this.datastore.get(id).then(
                object => this.sync(object)
            );
        });
    }

    private storeObjectId(objectId: string) {

        if (this.objectsToSyncIds.indexOf(objectId) == -1)
            this.objectsToSyncIds.push(objectId);
    }

    private removeObjectId(objectId: string) {

        var index: number = this.objectsToSyncIds.indexOf(objectId);
        if (index != -1)
            this.objectsToSyncIds.splice(index, 1);
    }

}