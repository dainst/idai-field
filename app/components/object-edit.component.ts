import {Component, Input, OnInit} from '@angular/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {ObjectList} from "../services/object-list";
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "@angular/common";
import {ProjectConfiguration} from "../model/project-configuration";
import {RelationPickerGroupComponent} from "./relation-picker-group.component";
import {ValuelistComponent} from "./valuelist.component";
import {OnChanges} from "@angular/core";
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

    public setType(type: string) {

        this.object.type = type;
        this.setFieldsForObjectType();
    }

    private setFieldsForObjectType() {
        if (this.object==undefined) return;
        if (!this.projectConfiguration) return;
        this.fieldsForObjectType=this.projectConfiguration.getFields(this.object.type);
    }

    public ngOnChanges() {
        if (this.object) {
            this.setFieldsForObjectType();
            this.types=this.projectConfiguration.getTypes();
        }
    }

    /**
     * Saves the object to the local datastore.
     */
    public save() {
        this.messages.clear();

        this.objectList.persistChangedObjects().then(
            () => {
                this.messages.add(M.OBJLIST_SAVE_SUCCESS);
            },
            errors => {
                if (errors) {
                    for (var i in errors) {
                        this.messages.add(errors[i]);
                    }
                }
            }
        );
    }

    public markAsChanged() {
        this.objectList.setChanged(this.object);
    }

}