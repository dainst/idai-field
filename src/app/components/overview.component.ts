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

    /**
     * The Object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;

    /**
     * The object under creation which has not been yet put to the list permanently.
     * As soon as it is validated successfully newObject is set to "undefined" again.
     */
    private newObject: any;

    constructor(private datastore: Datastore,
        @Inject('app.config') private config,
        @Inject('app.dataModelConfig') private dataModelConfig,
        private objectList: ObjectList) {
    }

    public onSelect(object: IdaiFieldObject) {

        if (this.newObject && object != this.newObject) this.removeObjectFromListIfNotValid();

        this.setSelectedObject(object);
    }

    public onCreate() {

        if (this.newObject) this.removeObjectFromListIfNotValid();

        if (!this.newObject) {
            this.newObject = {};
            this.objectList.getObjects().unshift(this.newObject);
        }

        this.setSelectedObject(this.newObject);
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

        if (!this.newObject.id || !this.newObject.valid) {

            var index = this.objectList.getObjects().indexOf(this.newObject);
            this.objectList.getObjects().splice(index, 1);
        }
        this.newObject = undefined;
    }

    private setSelectedObject(object: IdaiFieldObject) {

        // TODO check for object type here and set type schema accordingly
        if (this.dataModelConfig && this.dataModelConfig["types"]) {

            // NOTE that the reference of currentSchema must stay the same.
            this.objectList.getObjectTypeSchema()["fields"] = this.dataModelConfig["types"][4]["fields"];

            console.log("", this.objectList.getObjectTypeSchema)
        }

        this.objectList.validateAndSave(this.selectedObject, true);
        this.selectedObject = object;
    }

}
