import {Component, OnInit} from 'angular2/core';
import {PouchdbDatastore} from '../services/pouchdb-datastore';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {provide} from "angular2/core";

@Component({
    templateUrl: 'templates/overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 */
export class OverviewComponent implements OnInit {

    public selectedObject: IdaiFieldObject;
    public objects: IdaiFieldObject[];

    constructor(private datastore: Datastore) {
    }

    deepCopyObject(from: IdaiFieldObject,to: IdaiFieldObject) {
        to._id = from._id;
        to.title = from.title;
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject = { _id: "", title: ""};
        this.deepCopyObject(object,this.selectedObject);
    }

    getObjectIndex( id: String ) {
        for (var i in this.objects) {
            if (this.objects[i]._id==id) return i;
        }
        return null;
    }

    save(object: IdaiFieldObject) {
        this.deepCopyObject(
            object,
            this.objects[this.getObjectIndex(object._id)]
        );
    }

    ngOnInit() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        });
    }
}