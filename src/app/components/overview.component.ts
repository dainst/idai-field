import {Component, OnInit} from 'angular2/core';
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
        to.synced = from.synced;
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject = { _id: "", title: "", synced: true};
        this.deepCopyObject(object,this.selectedObject);
    }

    getObjectIndex( id: String ) {
        for (var i in this.objects) {
            if (this.objects[i]._id==id) return i;
        }
        return null;
    }

    fakeSync() {
        for (var o of this.objects) o.synced=true;
    }

    save(object: IdaiFieldObject) {

        this.datastore.save(object).then(
            data => {

                this.deepCopyObject(
                    object,
                    this.objects[this.getObjectIndex(object._id)]
                );

                this.objects[this.getObjectIndex(object._id)].synced = false;
            },
            err => { console.error(err) }
        )
    }

    ngOnInit() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));
    }
}