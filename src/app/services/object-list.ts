import {Injectable} from "angular2/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Messages} from "./messages";

/**
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()

export class ObjectList {

    constructor(private datastore: Datastore,
                private messages: Messages) {}

    /**
     * The Object currently selected in the list and shown in the edit component.
     */
    private selectedObject: IdaiFieldObject;

    /**
     * Indicates that the current instance of the selectedObject differs from the one
     * saved in the local datastore.
     */
    private changed: boolean;

    /**
     * The object under creation which has not been yet put to the list permanently.
     * As soon as it is validated successfully newObject is set to "undefined" again.
     */
    private newObject: any;

    private objects: IdaiFieldObject[];

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

    public getNewObject() {
        return this.newObject;
    }

    public setNewObject(object: any) {
        this.newObject = object;
    }

    public getSelectedObject() {
        return this.selectedObject;
    }

    public setSelectedObject(object: IdaiFieldObject) {
        this.selectedObject = object;
    }

    public setChanged() {
        this.changed = true;
    }

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    public save(object: IdaiFieldObject) {

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

        object.valid = true;

        this.datastore.update(object).then(
            () => this.messages.deleteMessages(),
            err => {
                this.messages.addMessage('danger', 'Object Identifier already exists.');
                object.valid = false;
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

    public validateAndSave(object: IdaiFieldObject) {

        if (!object || !object.valid) return;

        if (this.changed && object) {
            this.save(object);
        }
    }
}