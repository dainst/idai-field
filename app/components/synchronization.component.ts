import {Component, Inject, OnInit, Input, OnChanges} from 'angular2/core';
import {IdaiFieldBackend} from "../services/idai-field-backend";
import {Datastore} from '../datastore/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ProjectConfiguration} from "../model/project-configuration";

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
@Component({

    selector: 'synchronization',
    templateUrl: 'templates/synchronization.html'
})

export class SynchronizationComponent implements OnChanges {


    @Input() projectConfiguration: ProjectConfiguration;

    private connected: boolean = false;
    private objectsToSyncIds: string[] = [];

    constructor(private idaiFieldBackend: IdaiFieldBackend,
        private datastore: Datastore) {}


    ngOnChanges(changes:{}):any {
        if (this.projectConfiguration==undefined) return;

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

                this.storeObjectId(object.id);


                if (!this.connected) return;
                this.sync(object);
            },
            err => console.error("Could not fetch unsynced objects", err)
        );
    }

    private sync(object: IdaiFieldObject) {

        this.idaiFieldBackend.save(object,this.projectConfiguration.getExcavationName()).then(
            object => {
                object.synced = 1;
                this.datastore.update(object);
                this.removeObjectId(object.id);
                console.log("Successfully synced object", object);
            },
            err => {
                this.connected=false;
            }
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