import {Component, OnInit} from 'angular2/core';
import {PouchdbDatastore} from '../services/pouchdb-datastore';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {provide} from "angular2/core";

@Component({
    templateUrl: 'templates/overview.html'
})

export class OverviewComponent implements OnInit {

    public objects: IdaiFieldObject[];

    constructor(private datastore: Datastore) {

    }

    ngOnInit() {

        this.datastore.getObjects().then((objects) => {
            this.objects = objects;
        });
    }
}