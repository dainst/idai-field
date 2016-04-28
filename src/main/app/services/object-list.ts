import {Injectable,Inject} from "angular2/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./../datastore/datastore";
import {Messages} from "./messages";
import {M} from "./../m";

/**
 * @author Thomas Kleinke
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()

export class ObjectList {


    constructor(private datastore: Datastore,
                private messages: Messages) {}

    private objects: IdaiFieldObject[];

    /**
     * Saves an object to the local database if it is valid.
     * Creates a new object if the given object is not present in the datastore (which means the object doesn't
     * need to already have a technical id).
     * 
     * @param object The object to save. Must not be undefined.
     * @param restoreIfInvalid Defines if the object state saved in the datastore should be restored if the object
     * is invalid
     * @param showMessages Defines if error messages should be shown for the results of this operation
     */
    public validateAndSave(
        object: IdaiFieldObject, 
        restoreIfInvalid: boolean, 
        showMessages: boolean): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            if (!object) reject("No object given");

            if (showMessages) {
                this.messages.delete(M.OBJLIST_IDEXISTS);
                this.messages.delete(M.OBJLIST_IDMISSING);
            }

            if (object.changed) {
                this.save(object).then(
                    () => { resolve(); },
                    err => {
                        object.valid = false;

                        if (restoreIfInvalid) {
                            this.restoreObject(object).then(
                                () => { resolve(); },
                                err => { reject(err); }
                            );
                        } else {
                            switch (err) {
                                case "databaseError":
                                    if (showMessages) {
                                        this.messages.add(M.OBJLIST_IDEXISTS, 'danger');
                                    }
                                    break;
                                case "missingIdentifierError":
                                    if (showMessages) {
                                        this.messages.add(M.OBJLIST_IDMISSING, 'danger');
                                    }
                                    break;
                            }
                            resolve();
                        }
                    }
                )
            } else if (!object.valid && restoreIfInvalid) { // TODO WHY CAN I REMOVE RESTOREIFINVALID HERE WITHOUT BREAKING ANY TESTS?
                this.restoreObject(object).then(
                    () => { resolve(); },
                    err => { reject(err); }
                );
            } else resolve();
        });
    }

    /**
     * Saves the object corresponding to the given id to the local database if an object for this id exists and
     * the object is valid.
     * Cannot be used to create new objects.
     * @param objectId The technical id of the object to save
     * @param restoreIfInvalid Defines if the object state saved in the datastore should be restored if the object
     * is invalid
     * @param showMessages Defines if error messages should be shown for the results of this operation
     */
    public validateAndSaveById(objectId: string, restoreIfInvalid: boolean, showMessages: boolean): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.get(objectId).then(
                object => {
                    this.validateAndSave(object, restoreIfInvalid, showMessages).then(
                        () => { resolve(); },
                        err => { reject(err); }
                    )
                },
                err => {
                    reject("Object not found");
                }
            );
        });
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

        object.changed = false; // TODO CODE REVIEW - SHOULDNT IT GET SET TO FALSE ONLY IF SAVE WAS SUCCESSFUL?
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

    private restoreObject(object:IdaiFieldObject): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (object.id) {
                this.datastore.refresh(object.id).then(
                    restoredObject => {
                        var index = this.objects.indexOf(object);
                        this.objects[index] = restoredObject;
                        resolve();
                    },
                    err => { reject(err); }
                );
            }
        });
    }

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

}