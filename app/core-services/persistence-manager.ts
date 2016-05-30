import {Injectable} from "@angular/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "idai-components-2/idai-components-2";
import {RelationsProvider} from "../object-edit/relations-provider";
import {M} from "../m";

/**
 * @author Daniel de Oliveira
 */
@Injectable() export class PersistenceManager {
    
    constructor(
        private datastore: Datastore,
        private relationsProvider: RelationsProvider
    ) {}

    private object: IdaiFieldObject = undefined;
    private oldVersion : IdaiFieldObject = undefined;

    public setOldVersion(oldVersion) {
        this.oldVersion=JSON.parse(JSON.stringify(oldVersion));
    }
    
    public load(object) {
        this.object=object;
    }

    public unload() {
        this.object=undefined;
    }

    public isLoaded(): boolean {
        return (this.object!=undefined)
    }
    
    /**
     * Persists the loaded object and all the objects that are or have been in relation
     * with the object before the method call.
     *
     * @returns {Promise<string[]>} If all objects could get stored,
     *   the promise will just resolve to <code>undefined</code>. If one or more
     *   objects could not get stored properly, the promise will resolve to
     *   <code>string[]</code>, containing ids of M where possible,
     *   and error messages where not.
     */
    public persist() {

        return new Promise<any>((resolve, reject) => {
            if (this.object==undefined) return resolve();

            this.persistIt(this.object).then(()=> {
                Promise.all(this.makeGetPromises(this.object,this.oldVersion)).then((targetObjects)=> {

                    Promise.all(this.makeSavePromises(this.object,targetObjects)).then((targetObjects)=> {

                        this.unload();
                        resolve();
                    }, (err)=>reject(err));


                }, (err)=>reject(err))
            }, (err)=> { reject(this.toStringArray(err)); });
        });
    }

    private makeGetPromises(object,oldVersion) {
        var promisesToGetObjects = new Array();
        for (var id of this.extractRelatedObjectIDs(object)) {
            promisesToGetObjects.push(this.datastore.get(id))
        }
        for (var id of this.extractRelatedObjectIDs(oldVersion)) {
            promisesToGetObjects.push(this.datastore.get(id))
        }
        return promisesToGetObjects;
    }

    private makeSavePromises(object,targetObjects) {
        var promisesToSaveObjects = new Array();
        for (var targetObject of targetObjects) {

            this.pruneInverseRelations(this.object,targetObject);
            this.setInverseRelations(this.object, targetObject);
            promisesToSaveObjects.push(this.datastore.update(targetObject));
        }
        return promisesToSaveObjects;
    }

    private pruneInverseRelations(object,targetObject) {
        for (var prop in targetObject) {
            if (!targetObject.hasOwnProperty(prop)) continue;
            if (!this.relationsProvider.isRelationProperty(prop)) continue;

            var index=targetObject[prop].indexOf(object.id);
            if (index!=-1) {
                targetObject[prop].splice(index,1)
            }

            if (targetObject[prop].length==0) delete targetObject[prop];
        }
    }

    private setInverseRelations(object, targetObject) {
        for (var prop in object) {
            if (!object.hasOwnProperty(prop)) continue;
            if (!this.relationsProvider.isRelationProperty(prop)) continue;

            for (var id of object[prop]) {
                if (id!=targetObject.id) continue;

                var inverse = this.relationsProvider.getInverse(prop);

                if (targetObject[inverse]==undefined)
                    targetObject[inverse]=[];

                var index = targetObject[inverse].indexOf(object.id);
                if (index != -1) {
                    targetObject[inverse].splice(index, 1);
                }

                targetObject[inverse].push(object.id);
            }
        }
    }


    private extractRelatedObjectIDs(object:IdaiFieldObject) : Array<string> {
        var relatedObjectIDs = new Array();

        for (var prop in object) {
            if (!object.hasOwnProperty(prop)) continue;
            if (!this.relationsProvider.isRelationProperty(prop)) continue;

            for (var id of object[prop]) {
                relatedObjectIDs.push(id);
            }
        }
        return relatedObjectIDs;
    }
    

    /**
     * Saves the object to the local datastore.
     * @param object
     */
    private persistIt(object: IdaiFieldObject): Promise<any> {

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
    

    private toStringArray(str : any) : string[] {
        if ((typeof str)=="string") return [str]; else return str;
    }


}
