import {Component, Input, OnInit} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {ObjectList} from "../services/object-list";
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {ProjectConfiguration} from "../model/project-configuration";
import {RelationPickerGroupComponent} from "./relation-picker-group.component";
import {ValuelistComponent} from "./valuelist.component";
import {OnChanges} from "angular2/core";
import {Messages} from "../services/messages";
import {M} from "../m";

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
    @Input() projectConfiguration: ProjectConfiguration;
    

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

    constructor(
        private objectList: ObjectList,
        private messages: Messages) {
        
    }

    ngOnInit():any {
        this.setFieldsForObjectType(this); // bad, this is necessary for testing
    }

    /**
     * Saves the object to the local datastore.
     */
    public save() {
        this.saveRelatedObjects().then(
            () => {
                this.objectList.validateAndSave(this.object, false).then(
                    (result) => {
                        this.messages.delete(M.OBJLIST_IDEXISTS);
                        this.messages.delete(M.OBJLIST_IDMISSING);
                        if (result) this.messages.add(result,'danger')
                        this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));
                    },
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
                    promises.push(this.objectList.validateAndSaveById(relations[k]));
                }
                Promise.all(promises).then(
                    () => { resolve(); },
                    err => { reject(err); }
                );
            } else resolve();
        });
    }

    public triggerAutosave() {

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.save.bind(this), 500);
    }

    private setFieldsForObjectType(this_) {
        if (this_.object==undefined) return;
        if (!this.projectConfiguration) return;
        this.fieldsForObjectType=this.projectConfiguration.getFields(this.object.type);
    }

    public ngOnChanges() {
        if (this.object) {
            this.setFieldsForObjectType(this);
            this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));

            this.types=this.projectConfiguration.getTypes();
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