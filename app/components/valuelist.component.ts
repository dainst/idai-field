import {Component, Input} from '@angular/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "@angular/common";
import {IdaiFieldObject} from '../model/idai-field-object';
import {ObjectList} from "../services/object-list";

/**
 * @author Thomas Kleinke
 */
@Component({

    selector: 'valuelist',
    templateUrl: 'templates/valuelist.html',
    directives: [CORE_DIRECTIVES, COMMON_DIRECTIVES, FORM_DIRECTIVES]
})

export class ValuelistComponent {

    @Input() object: IdaiFieldObject;
    @Input() field: any;

    constructor(private objectList: ObjectList) {}

    public setValues(selectedOptions: HTMLCollection) {

        this.object[this.field.field] = [];
        for (var i = 0; i < selectedOptions.length; i++) {
            this.object[this.field.field].push(selectedOptions.item(i).childNodes[0].nodeValue);
        }
        this.objectList.setChanged(this.object);
    }

    public isSelected(item: string) {

        if (this.object[this.field.field])
            return (this.object[this.field.field].indexOf(item) > -1);
        else
            return false;
    }

}