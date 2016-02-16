import {Component, Input, SimpleChange, OnChanges} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "../services/datastore";
import {Messages} from "../services/messages";


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
    private changed: boolean; // indicates that the currently edited object differs from the one
                              // saved on the local datastore.

    constructor(private datastore: Datastore,
                private messages: Messages) { }

    /**
     * Saves the currently selected object to the local datastore.
     */
    private saveSelected() {
        this.save(this.selectedObject);
    }

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    private save(object: IdaiFieldObject) {

        // Replace with proper validation
        if (!object.identifier || object.identifier.length == 0)
            return;

        this.changed = false;
        object.synced = 0;

        if (object.id) {
            this.update(object);
        } else {
            this.create(object);
        }
    }

    /**
     * Updates an existing object in the local datastore.
     * @param object
     */
    private update(object: IdaiFieldObject) {

        object.valid=true;

        this.datastore.update(object).then(
            () => this.messages.deleteMessages(),
            err => {
                this.messages.addMessage('danger', 'Object Identifier already exists.');
                object.valid=false;
            }
        );
    }

    /**
     * Saves the given object as a new object in the local datastore.
     * @param object
     */
    private create(object: IdaiFieldObject) {

        object.valid=true;

        this.datastore.create(object).then(
            () => this.messages.deleteMessages(),
            err => {
                this.messages.addMessage('danger', 'Object Identifier already exists.');
                object.valid=false;
            }
        );
    }

    onKey(event: any) {

        this.changed = true;

        if (this.saveTimer)
            clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(this.saveSelected.bind(this), 500);
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }) {

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = undefined;
        }

        var previousObject: IdaiFieldObject = changes["selectedObject"].previousValue;
        if (!previousObject || !previousObject.valid) return;

        if (this.changed && previousObject) {
            this.save(previousObject);
        }
    }
}