import {Injectable} from "@angular/core";
import {IdaiFieldObject} from "../model/idai-field-object";
import {Entity} from "../core-services/entity";
import {Datastore} from "../core-services/datastore";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class Project {

    public constructor(private datastore: Datastore) {}
    
    public getObjects() : IdaiFieldObject[] {
        return this.objects;
    }

    public setObjects(objects: Entity[]) {
        this.objects = <IdaiFieldObject[]> objects;
    }

    public replace(object:IdaiFieldObject,restoredObject: IdaiFieldObject) {
        var index = this.objects.indexOf(object);
        this.objects[index] = restoredObject;
    }

    public remove(object: IdaiFieldObject) {
        var index = this.getObjects().indexOf(object);
        this.getObjects().splice(index, 1);
    }
    
    private objects: IdaiFieldObject[];

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
    public restore(object:IdaiFieldObject): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            if (object==undefined) resolve();

            console.log("will try to restore object ",object)

            if (!object.id) {
                this.remove(object);
                return resolve();
            }

            this.datastore.refresh(object.id).then(
                restoredObject => {

                    this.replace(object,<IdaiFieldObject>restoredObject);
                    resolve();
                },
                err => { reject(this.toStringArray(err)); }
            );
        });
    }


    private toStringArray(str : any) : string[] {
        if ((typeof str)=="string") return [str]; else return str;
    }
}