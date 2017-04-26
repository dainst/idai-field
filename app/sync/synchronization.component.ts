import {Component} from '@angular/core';
import {Inject} from '@angular/core';
import {Datastore} from 'idai-components-2/datastore';
import {ConfigLoader} from "idai-components-2/configuration";

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
    
    private connected: boolean = false;
    private on: boolean = false;
    private resourceIdsOfDocsToSync: string[] = [];

    constructor(private datastore: Datastore,
        private configLoader: ConfigLoader,
        @Inject('app.config') private config) {

        if (config['backend']==undefined) return;

        this.configLoader.getProjectConfiguration().then( conf => {
          if (conf.getProjectIdentifier()) {
            this.setupConnectionCheck();
            this.subscribeForUnsyncedDocuments();
          }
        })
    }

    private sync(doc: any) { }
    private setupConnectionCheck() { }
    private subscribeForUnsyncedDocuments() { }

    private storeDocsResourceId(doc) {
        if (doc && doc.resource && doc.resource.id) {
            this.storeObjectId(doc.resource.id)
        } else {
            console.error("got no document id in storeDocsResourceId ", doc)
        }
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
        const index: number = this.resourceIdsOfDocsToSync.indexOf(resourceId);
        if (index != -1)
            this.resourceIdsOfDocsToSync.splice(index, 1);
    }

}