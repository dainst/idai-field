import {Component, Input, SimpleChange, OnChanges} from 'angular2/core';
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "../services/datastore";
import {Message} from "../services/message";
import {MessageComponent} from "./message.component";

/**
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
@Component({

    selector: 'object-edit',
    templateUrl: 'templates/object-edit.html',
    directives: [MessageComponent]
})

export class ObjectEditComponent implements OnChanges {

    @Input() selectedObject: IdaiFieldObject;
    private saveTimer: number;
    private changed: boolean; // indicates that the currently edited object differs from the one
                              // saved on the local datastore.

    constructor(private datastore: Datastore,
                private message: Message) { }

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

        this.datastore.update(object).then(
            () => this.message.deleteMessage('OBEDIT'),
            err => this.message.addMessage('OBEDIT', 'update failed')
        );
    }

    /**
     * Saves the given object as a new object in the local datastore.
     * @param object
     */
    private create(object: IdaiFieldObject) {

        this.datastore.create(object).then(
            () => this.message.deleteMessage('OBEDIT'),
            err => this.message.addMessage('OBEDIT', 'create failed')
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

        if (this.changed && previousObject) {
            this.save(previousObject);
        }
    }
}