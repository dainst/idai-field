import {Component, Input} from 'angular2/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {IdaiFieldObject} from '../model/idai-field-object';
import {RelationPickerComponent} from "./relation-picker.component";
import {Datastore} from "../datastore/datastore";


/**
 * @author Thomas Kleinke
 */
@Component({

    selector: 'relation-picker-group',
    templateUrl: 'templates/relation-picker-group.html',
    directives: [CORE_DIRECTIVES, COMMON_DIRECTIVES, FORM_DIRECTIVES, RelationPickerComponent]
})

export class RelationPickerGroupComponent {

    @Input() object: IdaiFieldObject;
    @Input() field: any;
    @Input() parent: any;

    constructor(private datastore: Datastore) {}

    public createRelation() {

        if (!this.object[this.field.field]) this.object[this.field.field] = [];

        this.object[this.field.field].push("");
    }

    public deleteRelation(index: number) {

        var targetId = this.object[this.field.field][index];

        if (targetId.length == 0) {
            this.object[this.field.field].splice(index, 1);
        } else {
            this.deleteInverseRelation(targetId).then(
                () => {
                    this.object[this.field.field].splice(index, 1);
                    this.object.changed = true;
                    this.parent.save();
                },
                err => {
                    console.error(err);
                }
            );
        }
    }

    private deleteInverseRelation(targetId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            this.datastore.get(targetId).then(
                targetObject => {
                    var index = targetObject[this.field.inverse].indexOf(this.object.id);
                    if (index != -1) {
                        targetObject[this.field.inverse].splice(index, 1);
                        targetObject.changed = true;
                    }
                    resolve();
                },
                err => {
                    reject(err);
                }
            );
        });
    }

    public validateNewest(): boolean {

        var index: number = this.object[this.field.field].length - 1;

        if (!this.object[this.field.field][index] || this.object[this.field.field][index].length == 0) {
            return false;
        } else {
            return true;
        }
    }

}