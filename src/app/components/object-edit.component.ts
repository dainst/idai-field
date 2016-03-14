import {Component, Input, Inject} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "../datastore/datastore";
import {Messages} from "../services/messages";
import {ObjectList} from "../services/object-list";
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {DataModelConfiguration} from "../services/data-model-configuration";
import {RelationPickerGroupComponent} from "./relation-picker-group.component";
import {ValuelistComponent} from "./valuelist.component";
import {OnChanges} from "angular2/core";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
  */
@Component({
    directives: [FORM_DIRECTIVES, CORE_DIRECTIVES, COMMON_DIRECTIVES, RelationPickerGroupComponent, ValuelistComponent],
    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html'
})

export class ObjectEditComponent implements OnChanges {

    @Input() object: IdaiFieldObject;

    /**
     * The object as it is currently stored in the database (without recent changes)
     */
    private lastSavedVersion: IdaiFieldObject;

    private saveTimer: number;

    private relationFields: any[] = [
        { "field": "Belongs to", "inverse": "Includes" },
        { "field": "Includes", "inverse": "Belongs to" },

        { "field": "Above", "inverse": "Below" },
        { "field": "Below", "inverse": "Above" },
        { "field": "Next to", "inverse": "Next to" },

        { "field": "Is before", "inverse": "Is after" },
        { "field": "Is after", "inverse": "Is before" },
        { "field": "Is coeval with", "inverse": "Is coeval with" },

        { "field": "Cuts", "inverse": "Is cut by" },
        { "field": "Is cut by", "inverse": "Cuts" }
    ];

    constructor(private objectList: ObjectList,
                private dataModelConfiguration: DataModelConfiguration) {}

    /**
     * Saves the object to the local datastore.
     */
    public save() {

        this.saveRelatedObjects().then(
            () => {
                this.objectList.validateAndSave(this.object, false, true).then(
                    () => { this.lastSavedVersion = JSON.parse(JSON.stringify(this.object)); },
                    err => { console.error(err); }
                )
            },
            err => { console.error(err); }
        );
    }

    private saveRelatedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            var relations: string[] = [];

            for (var i in this.relationFields) {

                if (this.object[this.relationFields[i].field]) {
                    relations = relations.concat(this.object[this.relationFields[i].field]);
                }

                if (this.lastSavedVersion[this.relationFields[i].field]) {
                    for (var j in this.lastSavedVersion[this.relationFields[i].field]) {
                        if (relations.indexOf(this.lastSavedVersion[this.relationFields[i].field][j]) == -1) {
                            relations.push(this.lastSavedVersion[this.relationFields[i].field][j]);
                        }
                    }
                }
            }

            if (relations && relations.length > 0) {
                var promises: Promise<any>[] = [];
                for (var k in relations) {
                    promises.push(this.objectList.validateAndSaveById(relations[k], true, false));
                }
                Promise.all(promises).then(
                    () => { resolve(); },
                    err => { reject(err); }
                );
            } else resolve();
        });
    }

    public triggerAutosave() {

        console.log("save", this.object);

        this.object.changed = true;

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.save.bind(this), 500);
    }

    public ngOnChanges() {

        if (this.object) {
            this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));
        }
    }

    public setType(type: string) {

        this.object.type = type;
    }

    public getThis() {

        return this;
    }

}