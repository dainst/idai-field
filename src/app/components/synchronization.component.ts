import {Component, Inject, OnInit} from 'angular2/core';
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {Subscription} from 'rxjs/Subscription';

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
    private subscription: Subscription<boolean>;

    constructor(private idaiFieldBackend: IdaiFieldBackend,
        private datastore: Datastore) {}

    ngOnInit() {

        this.setupConnectionCheck();
    }

    private setupConnectionCheck() {

        this.idaiFieldBackend.isConnected().subscribe(
            connected => {
                this.connected = connected;
                if (connected) this.setupSync();
                else if (this.subscription) this.subscription.unsubscribe();
            }
        );
    }

    private setupSync() {

        this.subscription = this.datastore.getUnsyncedObjects().subscribe(
            object => this.sync(object),
            err => console.error("Could not fetch unsynced objects", err)
        );
    }

    private sync(object: IdaiFieldObject) {

        this.idaiFieldBackend.save(object).then(
            object => {
                object.synced = 1;
                this.datastore.update(object);
                console.log("Successfully synced object", object);
            },
            err => console.error("Synchronization failed", err, object)
        );
    }

}