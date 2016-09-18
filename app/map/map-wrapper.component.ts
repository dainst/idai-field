import {Component,OnInit} from '@angular/core';
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/map-wrapper.html'
})

/**
 * @author Daniel de Oliveira
 */
export class MapWrapperComponent implements OnInit {

    private docs;

    constructor(
        // TODO should be ReadDatastore but is not due to hack below.
        private datastore: IndexeddbDatastore
    ) {
        // TODO hack for test mode with loading objects when application starts on /map. Objects are too late in datastore.
        this.datastore.documentChangesNotifications().subscribe(()=>{
            this.datastore.all().then(documents=>{
                this.docs = documents;
            });
        });
    }

    ngOnInit(): void {
        this.datastore.all().then(documents=>{
           this.docs = documents;
        });
    }
}
