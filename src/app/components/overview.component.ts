import {Component, OnInit, Inject} from 'angular2/core';
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

    constructor(
        private datastore: Datastore,
        private elasticsearch: Elasticsearch,
        @Inject('app.config') private config
    ) {

    }

    deepCopyObject(from: IdaiFieldObject,to: IdaiFieldObject) {
        to.identifier = from.identifier;
        to.title = from.title;
        to.synced = from.synced;
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject = { identifier: "", title: "", synced: true};
        this.deepCopyObject(object,this.selectedObject);
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

        this.datastore.save(object).then( () => {

            this.deepCopyObject(
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

        this.elasticsearch.setHost(this.config.serverUri);
        
    }
}