import {Component, Input, SimpleChange, OnChanges} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "../services/datastore";
import {Messages} from "../services/messages";
import {ObjectList} from "../services/object-list";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({

    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html'
})

export class ObjectEditComponent implements OnChanges {

    private saveTimer: number;

    constructor(private objectList: ObjectList) { }

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

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        /*
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = undefined;
        }
        */
    }
}