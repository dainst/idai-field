import {Injectable,Inject} from "angular2/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./../datastore/datastore";
import {Messages} from "./messages";
import {MessagesDictionary} from "./messages-dictionary";

/**
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()

export class ObjectList {


    constructor(private datastore: Datastore,
                private messages: Messages,
                @Inject('app.dataModelConfig') private dataModelConfig) {}

    /**
     * Indicates that the current instance of the selectedObject differs from the one
     * saved in the local datastore.
     */
    private changed: boolean;

    private objects: IdaiFieldObject[];

    public validateAndSave(object: IdaiFieldObject, restoreIfInvalid: boolean) {

        if (!object) return;

        this.messages.delete(MessagesDictionary.MSGKEY_OBJLIST_IDEXISTS);
        this.messages.delete(MessagesDictionary.MSGKEY_OBJLIST_IDMISSING);

        if (this.changed) {
            this.save(object).then(
                () => { },
                err => {
                    object.valid = false;

                    if (restoreIfInvalid) {
                        this.restoreObject(object);
                    } else {
                        switch (err) {
                            case "databaseError":
                                this.messages.add(MessagesDictionary.MSGKEY_OBJLIST_IDEXISTS, 'danger');
                                break;
                            case "missingIdentifierError":
                                this.messages.add(MessagesDictionary.MSGKEY_OBJLIST_IDMISSING, 'danger');
                                break;
                        }
                    }
                }
            )
        } else if (!object.valid && restoreIfInvalid) { // TODO WHY CAN I REMOVE RESTOREIFINVALID HERE WITHOUT BREAKING ANY TESTS?
            this.restoreObject(object);
        }
    }

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    private save(object: IdaiFieldObject): any {

        // Replace with proper validation
        if (!object.identifier || object.identifier.length == 0) {
            return new Promise((resolve, reject) => { reject("missingIdentifierError"); });
        }

        this.changed = false; // TODO CODE REVIEW - SHOULDNT IT GET SET TO FALSE ONLY IF SAVE WAS SUCCESSFUL?
        object.synced = 0;

        object.valid=true;
        if (object.id) {
            return this.update(object);
        } else {
            return this.create(object);
        }
    }

    /**
     * Updates an existing object in the local datastore.
     * @param object
     */
    private update(object: IdaiFieldObject) : any {
        return this.datastore.update(object);
    }

    /**
     * Saves the given object as a new object in the local datastore.
     * @param object
     */
    private create(object: IdaiFieldObject) : any {
        return this.datastore.create(object);
    }

    private restoreObject(object:IdaiFieldObject) {

        if (object.id) {
            this.datastore.refresh(object.id).then(
                restoredObject => {
                    var index = this.objects.indexOf(object);
                    this.objects[index] = restoredObject;
                },
                err => {
                    // TODO handle error
                }
            );
        }
    }

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

    public setChanged() {
        this.changed = true;
    }
}