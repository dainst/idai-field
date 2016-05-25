import {Injectable} from "@angular/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./../datastore/datastore";
import {Project} from "./../model/project";
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

export class PersistenceManager {
    
    constructor(
        private datastore: Datastore,
        private project: Project
    ) {}


    private relationFields: any[] = [
        { "field": "Belongs to", "inverse": "Includes", "label": "Enthalten in" },
        { "field": "Includes", "inverse": "Belongs to", "label": "Enthält" },

        { "field": "Above", "inverse": "Below", "label": "Oberhalb von" },
        { "field": "Below", "inverse": "Above", "label": "Unterhalb von" },
        { "field": "Next to", "inverse": "Next to", "label": "Benachbart zu" },

        { "field": "Is before", "inverse": "Is after", "label": "Zeitlich vor" },
        { "field": "Is after", "inverse": "Is before", "label": "Zeitlich nach" },
        { "field": "Is coeval with", "inverse": "Is coeval with", "label": "Zeitgleich mit" },

        { "field": "Cuts", "inverse": "Is cut by", "label": "Schneidet" },
        { "field": "Is cut by", "inverse": "Cuts", "label": "Wird geschnitten von" }
    ];


    private object: IdaiFieldObject = undefined;

    
    public setChanged(object) {
        console.log("marked as changed",object)
        this.object=object;
    }

    public isChanged(): boolean {
        return (this.object!=undefined)
    }

    
    
    /**
     * Persists all objects marked as changed to the database.
     * In case there are objects not yet present in the datastore
     * they get created.
     *
     * @returns {Promise<string[]>} If all objects could get stored,
     *   the promise will just resolve to <code>undefined</code>. If one or more
     *   objects could not get stored properly, the promise will resolve to
     *   <code>string[]</code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public persistO() {

        return new Promise<any>((resolve, reject) => {

            if (this.object==undefined) resolve();
            var object=this.object;

            this.persist(object).then(()=> {
                console.log("PERSIST:", object);

                var promisesToGetObjects = new Array();
                for (var id of this.extractRelatedObjectIDs(object))
                    promisesToGetObjects.push(this.datastore.get(id))

                var promisesToSaveObjects = new Array();
                Promise.all(promisesToGetObjects).then((targetObjects)=> {
                    for (var targetObject of targetObjects) {
                        this.setInverseRelations(object, targetObject);
                        promisesToSaveObjects.push(this.datastore.update(targetObject));
                    }

                    Promise.all(promisesToSaveObjects).then((targetObjects)=> {
                        console.log("saved target objects ", targetObjects);

                        this.object=undefined;
                        resolve();
                    }, (err)=>reject(err));


                }, (err)=>reject(err))
            }, (err)=> { reject(new Array(err)); });
        });

    }

    private setInverseRelations(object, targetObject) {
        for (var prop in object) {
            if (!object.hasOwnProperty(prop)) continue;
            if (!this.isRelationProperty(prop)) continue;

            for (var id of object[prop]) {
                if (id!=targetObject.id) continue;

                if (targetObject[this.getInverse(prop)]==undefined)
                    targetObject[this.getInverse(prop)]=[];

                var index = targetObject[this.getInverse(prop)].indexOf(object.id);
                if (index != -1) {
                    targetObject[this.getInverse(prop)].splice(index, 1);
                }

                targetObject[this.getInverse(prop)].push(object.id);
                console.log("target:",targetObject)
            }
        }
    }

    private getInverse(prop) {
        for (var p of this.relationFields) {
            if (p["field"]==prop) return p["inverse"];
        }
        return undefined;
    }


    private extractRelatedObjectIDs(object:IdaiFieldObject) : Array<string> {
        var relatedObjectIDs = new Array();

        for (var prop in object) {
            if (!object.hasOwnProperty(prop)) continue;
            if (!this.isRelationProperty(prop)) continue;

            // TODO iterate over target ids
            relatedObjectIDs.push(object[prop].toString());
        }
        return relatedObjectIDs;
    }

    private isRelationProperty(propertyName:string):boolean {
        for (var p of this.relationFields) {
            if (p["field"]==propertyName) return true;
        }
        return false;
    }

    /**
     * Restores all objects marked as changed by resetting them to
     * back to the persisted state. In case there are any objects marked
     * as changed which were not yet persisted, they get deleted from the list.
     *
     * @returns {Promise<string[]>} If all objects could get restored,
     *   the promise will just resolve to <code>undefined</code>. If one or more
     *   objects could not get restored properly, the promise will resolve to
     *   <code>string[]</code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public restoreChangedObjects(): Promise<string[]> {

        return new Promise<any>((resolve, reject) => {
            // Promise.all(this.applyOn(this.changedObjects,this.restore)).then(
            //     () => {
            //         this.reset();
                    resolve();
                // },
                // errors => reject(this.toStringArray(errors))
            // );
        });
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
            // TODO isn't it a problem that create resolves to object id?
            // wouldn't persistChangedObjects() interpret it as an error?
            // why does this not happen?
            return this.datastore.create(object);
        }
    }

    private restore(object: IdaiFieldObject): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (!object.id) {
                this.project.remove(object);
                return resolve();
            }

            this.datastore.refresh(object.id).then(
                restoredObject => {

                    this.project.replace(object,restoredObject);
                    this.setUnchanged();
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
        this.object = undefined;
    }

    private toStringArray(str : any) : string[] {
        if ((typeof str)=="string") return [str]; else return str;
    }

    private setUnchanged() {
        this.object=undefined;
    }
}
