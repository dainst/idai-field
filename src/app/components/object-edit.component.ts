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

    private saveTimer: number;

    constructor(private objectList: ObjectList,
        @Inject('app.dataModelConfig') private dataModelConfig) { } // TODO remove this here and add this to object-list

    /**
     * Saves the currently selected object to the local datastore.
     */
    private saveSelected() {
        this.objectList.validateAndSave(this.objectList.getSelectedObject(), false);
    }

    onKey(event: any) {

        this.objectList.setChanged();

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.saveSelected.bind(this), 500);
    }

    public test(): IdaiFieldObject {
        console.log("TEST DATA MODEL CONFIG: ", this.dataModelConfig);
        return this.objectList.getSelectedObject();       
    }
}