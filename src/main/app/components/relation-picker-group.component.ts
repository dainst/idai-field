import {Component, Input} from 'angular2/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {IdaiFieldObject} from '../model/idai-field-object';
import {RelationPickerComponent} from "./relation-picker.component";


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

    public createRelation() {

        if (!this.object[this.field.field]) this.object[this.field.field] = [];

        this.object[this.field.field].push("");
    }

    public validateNewest(): boolean {

        var index: number = this.object[this.field.field].length - 1;

        if (!this.object[this.field.field][index] || this.object[this.field.field][index].length == 0) {
            return false;
        } else {
            return true;
        }
    }

    public getThis(): RelationPickerGroupComponent {

        return this;
    }

}