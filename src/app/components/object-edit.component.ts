import {Component, Input, SimpleChange, OnChanges} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {ModelUtils} from '../model/model-utils';
import {Datastore} from "../services/datastore";
import {IdaiFieldBackend} from "../services/idai-field-backend";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({

    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html'
})

export class ObjectEditComponent implements OnChanges {

    @Input() selectedObject: IdaiFieldObject;
    private saveTimer: number;
    private changed: boolean;

    constructor(private datastore: Datastore) { }

    /**
     * Saves the currently selected object to the local datastore.
     */
    saveSelected() {

        this.save(this.selectedObject);
    }

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    save(object: IdaiFieldObject) {

        this.changed = false;
        object.synced = false;
        this.datastore.update(object).then(
            () => {},
            err => console.error(err)
        );
    }

    onKey(event: any) {

        this.changed = true;

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.saveSelected.bind(this), 500);
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        var previousObject: IdaiFieldObject = changes["selectedObject"].previousValue;

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = undefined;
        }

        if (this.changed && previousObject)
            this.save(previousObject);
    }
}