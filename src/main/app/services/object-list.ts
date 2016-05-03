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
    
    constructor(private datastore: Datastore) {}

    private objects: IdaiFieldObject[];

    /**
     * Saves an object to the local database if it is valid.
     * Creates a new object if the given object is not present in the datastore (which means the object doesn't
     * need to already have a technical id).
     * 
     * @param object The object to save. Must not be undefined.
     * @param restoreIfInvalid Defines if the object state saved in the datastore should be restored if the object
     * is invalid
     * @return promise. Gets resolved in case the object was stored or
     *   at least recovered when restoreIfInvalid is set to true.
     *   Gets rejectected in case of errors, which are keys of M to identify the error
     *   if possible.
     * @throws if object is not defined.
     */
    public trySave(
        object: IdaiFieldObject): Promise<any> {

        if (!object) throw "object must not be undefined";

        return new Promise<any>((resolve, reject) => {

            this.save(object).then(
                
                () => resolve(),
                err => { reject(err) }
            )
        });
    }

    /**
     * Saves the object corresponding to the given id to the local database if an object for this id exists and
     * the object is valid.
     * Cannot be used to create new objects.
     * @param objectId The technical id of the object to save
     */
    public trySaveById(objectId: string): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            this.datastore.get(objectId).then(
                object => {
                    this.trySave(object).then(
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
            return new Promise((resolve, reject) => { reject(M.OBJLIST_IDMISSING); });
        }

        object.synced = 0;

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

    public restoreObject(object: IdaiFieldObject): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (!object.id) {
                this.removeObjectFromList(object);
                resolve();
                return;
            }

            this.datastore.refresh(object.id).then(
                restoredObject => {
                    var index = this.objects.indexOf(object);
                    this.objects[index] = restoredObject;
                    resolve();
                },
                err => { reject(err); }
            );
        });
    }

    private removeObjectFromList(object: IdaiFieldObject) {
        var index = this.getObjects().indexOf(object);
        this.getObjects().splice(index, 1);
    }

    public getObjects() {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
    }

}