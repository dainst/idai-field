import {Component, OnInit, Inject} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectEditComponent} from "./object-edit.component";
import {ObjectList} from "../services/object-list";

@Component({
    templateUrl: 'templates/overview.html',
    directives: [ObjectEditComponent],
    providers: [ObjectList]
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class OverviewComponent implements OnInit {

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
                private objectList: ObjectList) {
    }

    public onSelect(object: IdaiFieldObject) {

        if (this.objectList.getNewObject() && object != this.objectList.getNewObject()) this.removeObjectFromListIfNotValid();

        this.objectList.setSelectedObject(object);
    }

    public onCreate() {

        if (this.objectList.getNewObject()) this.removeObjectFromListIfNotValid();

        if (!this.objectList.getNewObject()) {
            this.objectList.setNewObject({});
            this.objectList.getObjects().unshift(this.objectList.getNewObject());
        }

        this.objectList.setSelectedObject(this.objectList.getNewObject());
    }

    onKey(event:any) {

        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objectList.setObjects(objects);
            }).catch(err => console.error(err));
        }
    }

    ngOnInit() {

        if (this.config.environment == "test") {
            setTimeout(() => this.fetchObjects(), 500);
        } else {
            this.fetchObjects();
        }
    }

    private fetchObjects() {

        this.datastore.all({}).then(objects => {
            this.objectList.setObjects(objects);
        }).catch(err => console.error(err));
    }

    private removeObjectFromListIfNotValid() {

        if (!this.objectList.getNewObject().id || !this.objectList.getNewObject().valid) {

            var index = this.objectList.getObjects().indexOf(this.objectList.getNewObject());
            this.objectList.getObjects().splice(index, 1);
        }
        this.objectList.setNewObject(undefined);
    }


}
