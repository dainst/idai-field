import {Component, OnInit, Inject} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {provide} from "angular2/core";
import {IdaiFieldBackend} from '../services/idai-field-backend';
import {Utils} from '../utils';

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

    constructor(
        private datastore: Datastore,
        private elasticsearch: IdaiFieldBackend,
        @Inject('app.config') private config
    ) {

    }



    onSelect(object: IdaiFieldObject) {
        this.selectedObject = { identifier: "", title: "", synced: true};
        Utils.deepCopyObject(object,this.selectedObject);
    }

    getObjectIndex( id: String ) {
        for (var i in this.objects) {
            if (this.objects[i].identifier==id) return i;
        }
        return null;
    }

    fakeSync() {
        for (var o of this.objects) o.synced=true;
    }

    sync() {

        for (var o of this.objects) {

            this.elasticsearch.save(o)
                .then(
                    object => {

                        object.synced = true;
                    },
                    err => {
                    }
                );
        }
    }

    save(object: IdaiFieldObject) {

        this.datastore.update(object).then( () => {

            Utils.deepCopyObject(
                object,
                this.objects[this.getObjectIndex(object.identifier)]
            );

            this.objects[this.getObjectIndex(object.identifier)].synced = false;
        }).catch( err => { console.error(err) });

    }

    onKey(event:any) {
        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        }
    }

    ngOnInit() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));
    }
}