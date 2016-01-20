import {Component, OnInit} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {provide} from "angular2/core";
import {Elasticsearch} from '../services/elasticsearch';

@Component({
    templateUrl: 'templates/overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export class OverviewComponent implements OnInit {

    public selectedObject: IdaiFieldObject;
    public objects: IdaiFieldObject[];

    constructor(private datastore: Datastore, private elasticsearch: Elasticsearch) {
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

    sync() {
        this.elasticsearch.isOnline();
    }

    save(object: IdaiFieldObject) {

        this.datastore.save(object).then( () => {

            this.deepCopyObject(
                object,
                this.objects[this.getObjectIndex(object._id)]
            );

            this.objects[this.getObjectIndex(object._id)].synced = false;
        }).catch( err => { console.error(err) });

    }

    ngOnInit() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));

        this.elasticsearch.setHost('http://127.0.0.1:9200');

    }
}