import {Component,OnInit} from '@angular/core';
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";

@Component({
    moduleId: module.id,
    templateUrl: '../../templates/map-wrapper.html'
})

/**
 */
export class MapWrapperComponent implements OnInit {

    private docs;

    constructor(
        private datastore: IndexeddbDatastore
    ) {

    }

    ngOnInit(): void {
        console.log("hier is on init")

        this.datastore.all().then(documents=>{
           this.docs = documents;
        });
    }
}
