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
 * @author Daniel de Oliveira
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
        this.setFieldsForObjectType(); // bad, this is necessary for testing
    }

    private setFieldsForObjectType() {
        if (this.object==undefined) return;
        if (!this.projectConfiguration) return;
        this.fieldsForObjectType=this.projectConfiguration.getFields(this.object.type);
    }

    public ngOnChanges() {
        if (this.object) {
            this.setFieldsForObjectType();
            this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));

            this.types=this.projectConfiguration.getTypes();
        }
    }

    public getThis(): ObjectEditComponent {
        return this;
    }


    /**
     * Saves the object to the local datastore.
     */
    public save() {
        this.messages.delete(M.OBJLIST_IDEXISTS);
        this.messages.delete(M.OBJLIST_IDMISSING);
        this.messages.delete(M.OBJLIST_SAVE_SUCCESS);

        this.objectList.trySave(this.object).then(
            () => {
                this.saveRelatedObjects().then(
                    () => {
                        this.messages.add(M.OBJLIST_SAVE_SUCCESS, 'success');
                        this.lastSavedVersion = JSON.parse(JSON.stringify(this.object));
                    },
                    err => { console.error(err); }
                );
            },
            err => { if (err) this.messages.add(err,'danger'); }
        );
    }

    /**
     * @param object
     * @param lastSavedVersion
     * @returns {string[]} technical ids of all the objects targeted by the objects relations.
     */
    private gatherRelationIds(object,lastSavedVersion) {

        var relationIds: string[] = [];
        for (var i in this.relationFields) {

            if (object[this.relationFields[i].field]) {
                relationIds = relationIds.concat(object[this.relationFields[i].field]);
            }

            if (lastSavedVersion[this.relationFields[i].field]) {
                for (var j in lastSavedVersion[this.relationFields[i].field]) {
                    if (relationIds.indexOf(lastSavedVersion[this.relationFields[i].field][j]) == -1) {
                        relationIds.push(lastSavedVersion[this.relationFields[i].field][j]);
                    }
                }
            }
        }
        return relationIds;
    }

    private saveRelatedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            var relationIds: string[] = this.gatherRelationIds(this.object,this.lastSavedVersion);
            if (!relationIds || relationIds.length <= 0)
                resolve();

            var promises: Promise<any>[] = [];
            for (var i in relationIds)
                promises.push(this.objectList.trySaveById(relationIds[i]));

            Promise.all(promises).then(
                () => resolve(),
                err => reject(err)
            );
        });
    }

    public markAsChanged() {
        this.objectList.setChanged(this.object, true);
    }

}