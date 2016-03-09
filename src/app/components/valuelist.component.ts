import {Component, Input} from 'angular2/core';
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";
import {IdaiFieldObject} from '../model/idai-field-object';

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
    @Input() parent: any;


    public save(selectedOptions: HTMLCollection) {

        this.object[this.field.field] = [];
        for (var i = 0; i < selectedOptions.length; i++) {
            this.object[this.field.field].push(selectedOptions.item(i).childNodes[0].nodeValue);
        }
        this.parent.triggerAutosave();
    }

    public isSelected(item: string) {

        if (this.object[this.field.field])
            return (this.object[this.field.field].indexOf(item) > -1);
        else
            return false;
    }

}