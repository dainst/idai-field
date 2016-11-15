import {Component} from '@angular/core';
import {IdaiFieldBackend} from "./idai-field-backend";
import {Inject} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {SyncMediator} from './sync-mediator';
import {ProjectConfiguration, ConfigLoader} from "idai-components-2/documents";

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
@Component({
    moduleId: module.id,
    selector: 'synchronization',
    templateUrl: './synchronization.html'
})

export class SynchronizationComponent {
    
    private projectConfiguration : ProjectConfiguration;

    private connected: boolean = false;
    private resourceIdsOfDocsToSync: string[] = [];

    constructor(private idaiFieldBackend: IdaiFieldBackend,
        private datastore: Datastore,
        private configLoader: ConfigLoader,
        private syncMediator: SyncMediator,
        @Inject('app.config') private config) {

        if (config['backend']==undefined) return;

        

        this.configLoader.configuration().subscribe((result)=>{
            if(result.error == undefined) {
                this.projectConfiguration = result.projectConfiguration;
                this.setupConnectionCheck();
                this.subscribeForUnsyncedDocuments();
            } else {
                // TODO Meldung geben/zeigen wenn es ein Problem mit der Configration gibt
                //this.messages.add(result.error.msgkey);
            }
        });
    }

    private subscribeForUnsyncedDocuments() {

        this.syncMediator.getUnsyncedDocuments().subscribe(
            doc => {
                if (this.connected)
                    this.sync(doc);
                else this.storeObjectId(doc['resource']['id']);
            },
            err => console.error("Error in subscribeForUnsyncedDocuments(). ", err)
        );
    }

    private setupConnectionCheck() {
        this.idaiFieldBackend.connectionStatus().subscribe(
            connected => {
                this.connected = connected;
                if (connected) {
                    this.syncAll();
                }
            }
        );
    }

    private sync(doc: any) {

        this.idaiFieldBackend.save(doc,this.projectConfiguration.getExcavationName()).then(
            document => {
                document['synced'] = 1;
                this.datastore.update(document);
                this.removeObjectId(document['resource']['id']);
            },
            err => {
                this.connected=false;
            }
        );
    }

    private syncAll() {

        this.resourceIdsOfDocsToSync.forEach(id => {
            this.datastore.get(id).then(
                object => this.sync(object)
            );
        });
    }

    private storeObjectId(resourceId: string) {
        if (this.resourceIdsOfDocsToSync.indexOf(resourceId) == -1)
            this.resourceIdsOfDocsToSync.push(resourceId);
    }

    private removeObjectId(resourceId: string) {
        var index: number = this.resourceIdsOfDocsToSync.indexOf(resourceId);
        if (index != -1)
            this.resourceIdsOfDocsToSync.splice(index, 1);
    }

}