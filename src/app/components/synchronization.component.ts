import {Component, Inject, OnInit} from 'angular2/core';
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';

/**
 * @author Thomas Kleinke
 */
@Component({

    selector: 'synchronization',
    templateUrl: 'templates/synchronization.html'
})

export class SynchronizationComponent implements OnInit {

    private connectionCheckTimer: number;

    constructor(private idaiFieldBackend: IdaiFieldBackend,
        private datastore: Datastore,
        @Inject('app.config') private config) {}

    ngOnInit() {

        this.checkForSync();
    }

    checkForSync(): void {

        if (this.idaiFieldBackend.isConnected()) {

            this.datastore.getUnsyncedObjects()
                .then(objects => this.sync(objects))
                .catch(err => {
                    console.error(err);
                    this.resetTimeout();
                });
        } else {
            this.idaiFieldBackend.checkConnection()
                .then(result => this.resetTimeout());
        }
    }

    private resetTimeout() {
        
        this.connectionCheckTimer = setTimeout(this.checkForSync.bind(this), this.config.syncCheckInterval);
    }

    private sync(objects: IdaiFieldObject[]) {

        if (objects && objects.length > 0) {

            var promises = [];

            for (var obj of objects) {

                promises.push(this.idaiFieldBackend.save(obj)
                    .then(
                        object => {
                            object.synced = 1;
                            this.datastore.update(object);
                        },
                        err => { }
                    ));
            }

            Promise.all(promises).then(
                () => this.resetTimeout());
        } else
            this.resetTimeout();
    }
}