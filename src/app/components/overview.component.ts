import {Component, OnInit, Inject, provide} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {IdaiFieldBackend} from '../services/idai-field-backend';
import {ModelUtils} from '../model/model-utils';
import {ObjectEditComponent} from "./object-edit.component";

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    public selectedObject: IdaiFieldObject;
    public objects: IdaiFieldObject[];

    constructor(
        private datastore: Datastore,
        private idaiFieldBackend: IdaiFieldBackend,
        @Inject('app.config') private config) {
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject = object;
    }

    getObjectIndex( id: String ) {
        for (var i in this.objects) {
            if (this.objects[i].id==id) return i;
        }
        return null;
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
        this.fetchObjects();
        this.setupSync();
    }

    private fetchObjects() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));
    }

    private setupSync(): void {

        this.datastore.getObjectsToSync().subscribe(
            object => console.log("sync", object),
            err => console.error("sync failed", err),
            () => console.log("sync finished")
        );
    }
}
