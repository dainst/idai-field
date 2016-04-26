import {Component, Input, OnInit} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
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

export class ObjectEditComponent implements OnChanges,OnInit {


    @Input() object: IdaiFieldObject;

    /**
     * The object as it is currently stored in the database (without recent changes)
     */
    private lastSavedVersion: IdaiFieldObject;



    private saveTimer: number;

    private relationFields: any[] = [
        { "field": "Belongs to", "inverse": "Includes", "label": "Enthalten in" },
        { "field": "Includes", "inverse": "Belongs to", "label": "Enthält" },

        { "field": "Above", "inverse": "Below", "label": "Oberhalb von" },
        { "field": "Below", "inverse": "Above", "label": "Unterhalb von" },
        { "field": "Next to", "inverse": "Next to", "label": "Benachbart zu" },

        { "field": "Is before", "inverse": "Is after", "label": "Zeitlich vor" },
        { "field": "Is after", "inverse": "Is before", "label": "Zeitlich nach" },
        { "field": "Is coeval with", "inverse": "Is coeval with", "label": "Zeitgleich mit" },

        { "field": "Cuts", "inverse": "Is cut by", "label": "Schneidet" },
        { "field": "Is cut by", "inverse": "Cuts", "label": "Wird geschnitten von" }
    ];

    public types : string[];
    public fieldsForObjectType : any;

    constructor(private objectList: ObjectList,
                private dataModelConfiguration: DataModelConfiguration) {
    }

    ngOnInit():any {
        var this_=this;
        this.dataModelConfiguration.getTypes().then(function(types){
            this_.types=types;
        });
        this.setFieldsForObjectType(this); // bad, this is necessary for testing
    }

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

    private setFieldsForObjectType(this_) {
        if (this_.object==undefined) return;
        this.dataModelConfiguration.getFields(this.object.type).then(function(fields){
            this_.fieldsForObjectType=fields;
        });
    }

    public ngOnChanges() {
        if (this.object) {
            this.setFieldsForObjectType(this);
            this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));
        }
    }

    public setType(type: string) {

        this.object.type = type;
        this.setFieldsForObjectType(this);
    }

    public getThis(): ObjectEditComponent {

        return this;
    }

}