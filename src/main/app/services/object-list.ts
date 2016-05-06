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
     * Persists all objects marked as changed to the database.
     * In case there are objects not yet present in the datastore
     * they get created.
     *
     * @returns {Promise<any>} If all objects could get stored,
     *   the promise will resolve to <code>undefined</code>. If one or more
     *   objects could not get stored properly, the promise will resolve to
     *   <code>Promise<string[]></code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public persistChangedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.applyOn(this.changedObjects,this.persist)).then(
                () => {
                    this.reset();
                    resolve();
                },
                errors => reject(this.toStringArray(errors))
            );
        });
    }

    /**
     * Restores all objects marked as changed by resetting them to
     * back to the persisted state. In case there are any objects marked
     * as changed which were not yet persisted, they get deleted from the list.
     *
     * @returns {Promise<any>} If all objects could get restored,
     *   the promise will resolve to <code>undefined</code>. If one or more
     *   objects could not get restored properly, the promise will resolve to
     *   <code>Promise<string[]></code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public restoreChangedObjects(): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            Promise.all(this.applyOn(this.changedObjects,this.restore)).then(
                () => {
                    this.reset();
                    resolve();
                },
                errors => reject(this.toStringArray(errors))
            );
        });
    }

    public setChanged(object: IdaiFieldObject) {
        if (!this.isChanged(object))
            this.changedObjects.push(object);
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
                    this.setUnchanged(restoredObject);
                    resolve();
                },
                err => { reject(err); }
            );
        });
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

    private reset() {
        this.changedObjects = [];
    }

    private toStringArray(str) {
        if ((typeof str)=="string") return [str]; else return str;
    }

    private removeNewObjectFromList(object: IdaiFieldObject) {

        var index = this.getObjects().indexOf(object);
        this.getObjects().splice(index, 1);
    }

    private setUnchanged(object: IdaiFieldObject) {
        var index = this.changedObjects.indexOf(object);
        if (index > -1) this.changedObjects.splice(index, 1);
    }
}
