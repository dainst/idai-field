import {Component, Input, SimpleChange, Inject} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "../services/datastore";
import {Messages} from "../services/messages";
import {ObjectList} from "../services/object-list";
import {CORE_DIRECTIVES,COMMON_DIRECTIVES,FORM_DIRECTIVES} from "angular2/common";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({
    directives: [FORM_DIRECTIVES,CORE_DIRECTIVES,COMMON_DIRECTIVES],
    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html'
})

export class ObjectEditComponent {

    @Input() object: IdaiFieldObject;

    private saveTimer: number;

    constructor(private objectList: ObjectList) {}

    /**
     * Saves the object to the local datastore.
     */
    private save() {
        this.objectList.validateAndSave(this.object, false);
    }

    onKey(event: any) {

        this.objectList.setChanged();

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.save.bind(this), 500);
    }
}