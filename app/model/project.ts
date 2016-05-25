import {Injectable} from "@angular/core";
import {IdaiFieldObject} from "../model/idai-field-object";

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
@Injectable()
export class Project {

    public getObjects() : IdaiFieldObject[] {
        return this.objects;
    }

    public setObjects(objects: IdaiFieldObject[]) {
        this.objects = objects;
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
}