import {Component, Input, OnInit} from '@angular/core';
import {Entity} from "../core-services/entity";
import {PersistenceManager} from "../core-services/persistence-manager";
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "@angular/common";
import {ProjectConfiguration} from "../core-services/project-configuration";
import {RelationPickerGroupComponent} from "./relation-picker-group.component";
import {ValuelistComponent} from "./valuelist.component";
import {OnChanges} from "@angular/core";
import {Messages} from "../core-services/messages";
import {RelationsProvider} from "./relations-provider";
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

    @Input() object: Entity;
    @Input() projectConfiguration: ProjectConfiguration;

    public types : string[];
    public fieldsForObjectType : any;

    constructor(
        private persistenceManager: PersistenceManager,
        private messages: Messages,
        private relationsProvider: RelationsProvider // used from within template
    ) {
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

        this.persistenceManager.load(this.object);
        this.persistenceManager.persist().then(
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
        this.persistenceManager.load(this.object);
    }
}