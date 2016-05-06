import {Injectable} from "angular2/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./../datastore/datastore";
import {M} from "./../m";

/**
 * Keeps track of all the objects associated to the current object
 * and which one of them have changes that are not yet persisted.
 * Can be asked to either persist all of the changed objects or
 * restore them to their previous state, so that the actual objects
 * reflect the objects persisted state.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()

export class ObjectList {
    
    constructor(private datastore: Datastore) {}

    private objects: IdaiFieldObject[];

    /**
     * Contains references to all objects with unsaved changes.
     */
    private changedObjects: IdaiFieldObject[] = [];

    /**
     * Saves all changed objects to the local database if they are valid.
     * Creates a new object if an object is not present in the datastore (which means the objects don't
     * need to already have a technical id).
     * 
     * @return promise. Gets resolved in case the objects were stored successfully.
     * Gets rejected in case of errors, which are keys of M to identify the error if possible.
     */
    public persistChangedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.applyOn(this.changedObjects,this.persist)).then(
                () => {
                    this.reset();
                    resolve();
                },
                errors => {
                    if ((typeof errors)=="string") return reject([errors]); else return reject(errors);
                }
            );
        });
    }

    /**
     * Restores all changed objects.
     */
    public restoreChangedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.applyOn(this.changedObjects,this.restore)).then(
                () => {
                    this.reset();
                    resolve();
                },
                errors => reject(errors)
            );
        });
    }

    public setChanged(object: IdaiFieldObject, changed: boolean) {

        if (changed) {
            if (!this.isChanged(object)) {
                this.changedObjects.push(object);
            }
        } else {
            var index = this.changedObjects.indexOf(object);
            if (index > -1) this.changedObjects.splice(index, 1);
        }
    }

    public isChanged(object: IdaiFieldObject): boolean {
        return this.changedObjects.indexOf(object) > -1;
    }

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

    private reset() {
        this.changedObjects = [];
    }

    /**
     * Iterates over objects and collects the returned promises.
     *
     * @param objects
     * @param fun a function returning Promise<any>
     * @returns {Promise<any>[]} the collected promises.
     */
    private applyOn(objects,fun) : Promise<any>[] {

        var objectPromises:Promise<any>[] = [];
        for (var i in objects)
            objectPromises.push(fun.apply(this,[objects[i]]));
        return objectPromises;
    }

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    private persist(object: IdaiFieldObject): Promise<any> {

        // Replace with proper validation
        if (!object.identifier || object.identifier.length == 0) {
            return new Promise((resolve, reject) => { reject(M.OBJLIST_IDMISSING); });
        }

        object.synced = 0;

        if (object.id) {
            return this.datastore.update(object);
        } else {
            return this.datastore.create(object);
        }
    }

    private restore(object: IdaiFieldObject): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (!object.id) {
                this.removeNewObjectFromList(object);
                return resolve();
            }

            this.datastore.refresh(object.id).then(
                restoredObject => {
                    var index = this.objects.indexOf(object);
                    this.objects[index] = restoredObject;
                    this.setChanged(restoredObject, false);
                    resolve();
                },
                err => { reject(err); }
            );
        });
    }

    private removeNewObjectFromList(object: IdaiFieldObject) {

        var index = this.getObjects().indexOf(object);
        this.getObjects().splice(index, 1);
    }
}